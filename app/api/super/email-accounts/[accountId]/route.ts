import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import {
  updateEmailAccount,
  disconnectEmailAccount,
  getEmailIntegration,
} from "@/lib/server/services/email-integrations"

const updateSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  provider: z.enum(["gmail", "outlook", "other"]).optional(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * PATCH /api/super/email-accounts/[accountId]
 * Update an email account (superadmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { accountId } = await params

    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...updateData } = result.data

    // Verify account exists
    await getEmailIntegration({ integrationId: accountId, orgId })

    const account = await updateEmailAccount({
      integrationId: accountId,
      orgId,
      input: updateData,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated email account ${accountId}`
      )
    })

    return Response.json({ data: account })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/email-accounts/[accountId]
 * Delete an email account (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { accountId } = await params

    const body = await request.json()
    const result = deleteSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId } = result.data

    await disconnectEmailAccount({
      integrationId: accountId,
      orgId,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted email account ${accountId}`
      )
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
