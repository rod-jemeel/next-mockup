import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { createItemSchema, listItemsSchema } from "@/lib/validations/inventory"
import { parseSearchParams } from "@/lib/validations/common"
import { createItem, listItems } from "@/lib/server/services/inventory"

type RouteContext = { params: Promise<{ orgId: string }> }

/**
 * POST /api/orgs/:orgId/inventory/items
 * Create a new inventory item
 * Roles: org_admin, inventory
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    const { session, org } = await requireOrgAccess(orgId, ["org_admin", "inventory"])

    const body = await request.json()
    const result = createItemSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const item = await createItem({
      input: result.data,
      orgId: org.id,
      userId: session.user.id,
    })

    return Response.json({ data: item }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/orgs/:orgId/inventory/items
 * List inventory items
 * Roles: any member
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    const params = parseSearchParams(new URL(request.url))
    const result = listItemsSchema.safeParse(params)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const data = await listItems({
      query: result.data,
      orgId: org.id,
    })

    return Response.json({ data })
  } catch (error) {
    return handleError(error)
  }
}
