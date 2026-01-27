import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { listPrices, addPrice } from "@/lib/server/services/prices"
import { getItem } from "@/lib/server/services/inventory"

const addPriceSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  unitPrice: z.number().positive("Price must be positive"),
  vendor: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
  source: z.string().max(50).optional(),
  effectiveAt: z.string().datetime().optional(),
})

/**
 * GET /api/super/inventory/items/[itemId]/prices
 * Get price history for an item (superadmin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  await connection()

  try {
    await requireSuperadmin()
    const { itemId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")

    if (!orgId) {
      throw new ApiError("VALIDATION_ERROR", "orgId is required")
    }

    // Verify item exists
    await getItem({ itemId, orgId })

    const prices = await listPrices({
      itemId,
      orgId,
      query: {
        limit: 50,
      },
    })

    return Response.json({ data: prices })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/super/inventory/items/[itemId]/prices
 * Add a price entry for an item (superadmin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { itemId } = await params

    const body = await request.json()
    const result = addPriceSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...priceData } = result.data

    // Verify item exists
    await getItem({ itemId, orgId })

    const price = await addPrice({
      itemId,
      orgId,
      userId: session.user.id,
      input: priceData,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} added price $${priceData.unitPrice} to item ${itemId}`
      )
    })

    return Response.json({ data: price }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
