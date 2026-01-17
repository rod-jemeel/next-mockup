import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { addPriceSchema, listPricesSchema } from "@/lib/validations/inventory"
import { parseSearchParams } from "@/lib/validations/common"
import { addPrice, listPrices } from "@/lib/server/services/prices"
import { getItem } from "@/lib/server/services/inventory"

type RouteContext = { params: Promise<{ orgId: string; itemId: string }> }

/**
 * POST /api/orgs/:orgId/inventory/items/:itemId/prices
 * Add a new price entry (append-only)
 * Roles: org_admin, inventory
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, itemId } = await context.params
    const { session, org } = await requireOrgAccess(orgId, [
      "org_admin",
      "inventory",
    ])

    // Verify item exists and belongs to org
    await getItem({ itemId, orgId: org.id })

    const body = await request.json()
    const result = addPriceSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const price = await addPrice({
      input: result.data,
      itemId,
      orgId: org.id,
      userId: session.user.id,
    })

    return Response.json({ data: price }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/orgs/:orgId/inventory/items/:itemId/prices
 * Get price history for an item
 * Roles: any member
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, itemId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    // Verify item exists
    await getItem({ itemId, orgId: org.id })

    const params = parseSearchParams(new URL(request.url))
    const result = listPricesSchema.safeParse(params)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const data = await listPrices({
      query: result.data,
      itemId,
      orgId: org.id,
    })

    return Response.json({ data })
  } catch (error) {
    return handleError(error)
  }
}
