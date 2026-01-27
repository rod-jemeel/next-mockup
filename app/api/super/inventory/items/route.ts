import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { createItemSchema } from "@/lib/validations/inventory"
import { createItem } from "@/lib/server/services/inventory"
import { addPrice } from "@/lib/server/services/prices"
import { auth } from "@/lib/auth"

// Extended schema with orgId and optional initial price for superadmin
const superCreateItemSchema = createItemSchema.extend({
  orgId: z.string().uuid("Invalid organization ID"),
  initialPrice: z.coerce.number().positive().optional(),
})

/**
 * POST /api/super/inventory/items
 * Create an inventory item for any organization (superadmin only)
 * Optionally sets an initial price if provided
 */
export async function POST(request: NextRequest) {
  // Mark route as dynamic - auth requires request headers
  await connection()

  try {
    const session = await requireSuperadmin()

    const body = await request.json()
    const result = superCreateItemSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, initialPrice, ...itemData } = result.data

    // Verify org exists
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId: orgId },
    })

    if (!org) {
      throw new ApiError("ORG_NOT_FOUND", "Organization not found")
    }

    // Create the inventory item
    const item = await createItem({
      input: itemData,
      orgId: org.id,
      userId: session.user.id,
    })

    // If initial price provided, create price history entry
    if (initialPrice && initialPrice > 0) {
      await addPrice({
        input: {
          unitPrice: initialPrice,
          source: "admin-initial",
        },
        itemId: item.id,
        orgId: org.id,
        userId: session.user.id,
      })
    }

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} created inventory item in org ${org.name}: ${itemData.name}${initialPrice ? ` with initial price $${initialPrice}` : ""}`
      )
    })

    return Response.json({ data: item }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
