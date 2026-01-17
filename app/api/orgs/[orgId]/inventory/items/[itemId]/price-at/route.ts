import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { priceAtSchema } from "@/lib/validations/inventory"
import { parseSearchParams } from "@/lib/validations/common"
import { getPriceAt } from "@/lib/server/services/prices"
import { getItem } from "@/lib/server/services/inventory"

type RouteContext = { params: Promise<{ orgId: string; itemId: string }> }

/**
 * GET /api/orgs/:orgId/inventory/items/:itemId/price-at?at=ISO_TIMESTAMP
 * Get the price at a specific point in time
 * Roles: any member
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, itemId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    // Verify item exists
    await getItem({ itemId, orgId: org.id })

    const params = parseSearchParams(new URL(request.url))
    const result = priceAtSchema.safeParse(params)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const price = await getPriceAt({
      timestamp: result.data.at,
      itemId,
      orgId: org.id,
    })

    if (!price) {
      return Response.json({
        data: null,
        message: "No price recorded at this time",
      })
    }

    return Response.json({ data: price })
  } catch (error) {
    return handleError(error)
  }
}
