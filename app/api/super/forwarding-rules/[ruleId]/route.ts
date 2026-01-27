import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import {
  updateForwardingRule,
  deleteForwardingRule,
} from "@/lib/server/services/forwarding-rules"

const updateSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  notifyInApp: z.boolean().optional(),
  forwardEmail: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * PATCH /api/super/forwarding-rules/[ruleId]
 * Update a forwarding rule (superadmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { ruleId } = await params

    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...updateData } = result.data

    const rule = await updateForwardingRule({
      ruleId,
      orgId,
      data: updateData,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated forwarding rule ${ruleId}`
      )
    })

    return Response.json({ data: rule })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/forwarding-rules/[ruleId]
 * Delete a forwarding rule (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { ruleId } = await params

    const body = await request.json()
    const result = deleteSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId } = result.data

    await deleteForwardingRule({
      ruleId,
      orgId,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted forwarding rule ${ruleId}`
      )
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
