import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { updateItemSchema } from "@/lib/validations/inventory"
import {
  updateItem,
  deleteItem,
  getItem,
} from "@/lib/server/services/inventory"

// Extended schema with orgId for superadmin
const superUpdateItemSchema = updateItemSchema.extend({
  orgId: z.string().uuid("Invalid organization ID"),
})

const superDeleteSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * PATCH /api/super/inventory/items/[itemId]
 * Update an inventory item (superadmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { itemId } = await params

    const body = await request.json()
    const result = superUpdateItemSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...updateData } = result.data

    // Verify item exists and belongs to org
    const existing = await getItem({
      itemId,
      orgId,
    })

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Item not found")
    }

    const item = await updateItem({
      itemId,
      orgId,
      userId: session.user.id,
      input: updateData,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated inventory item ${itemId}`
      )
    })

    return Response.json({ data: item })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/inventory/items/[itemId]
 * Delete (deactivate) an inventory item (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { itemId } = await params

    const body = await request.json()
    const result = superDeleteSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId } = result.data

    await deleteItem({
      itemId,
      orgId,
      userId: session.user.id,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted inventory item ${itemId}`
      )
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
