import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import {
  updateEmailCategory,
  deleteEmailCategory,
} from "@/lib/server/services/email-categories"

const updateSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  name: z.string().max(100).optional(),
  description: z.string().max(500).nullish(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  keywords: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * PATCH /api/super/email-categories/[categoryId]
 * Update an email category (superadmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { categoryId } = await params

    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...updateData } = result.data

    const category = await updateEmailCategory({
      categoryId,
      orgId,
      data: updateData,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated email category ${categoryId}`
      )
    })

    return Response.json({ data: category })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/email-categories/[categoryId]
 * Delete an email category (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { categoryId } = await params

    const body = await request.json()
    const result = deleteSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId } = result.data

    await deleteEmailCategory({
      categoryId,
      orgId,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted email category ${categoryId}`
      )
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
