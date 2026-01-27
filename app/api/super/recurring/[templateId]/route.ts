import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { updateRecurringTemplateSchema } from "@/lib/validations/recurring-template"
import {
  updateRecurringTemplate,
  deleteRecurringTemplate,
  getRecurringTemplate,
} from "@/lib/server/services/recurring-templates"

// Extended schema with orgId for superadmin
const superUpdateRecurringSchema = updateRecurringTemplateSchema.extend({
  orgId: z.string().uuid("Invalid organization ID"),
})

const superDeleteSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * PATCH /api/super/recurring/[templateId]
 * Update a recurring template (superadmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { templateId } = await params

    const body = await request.json()
    const result = superUpdateRecurringSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...updateData } = result.data

    // Verify template exists and belongs to org
    const existing = await getRecurringTemplate({
      templateId,
      orgId,
    })

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Template not found")
    }

    const template = await updateRecurringTemplate({
      templateId,
      orgId,
      input: updateData,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated recurring template ${templateId}`
      )
    })

    return Response.json({ data: template })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/recurring/[templateId]
 * Delete (deactivate) a recurring template (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { templateId } = await params

    const body = await request.json()
    const result = superDeleteSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId } = result.data

    await deleteRecurringTemplate({
      templateId,
      orgId,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted recurring template ${templateId}`
      )
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
