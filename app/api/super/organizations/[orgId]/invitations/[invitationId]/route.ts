import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError } from "@/lib/errors"
import { auth } from "@/lib/auth"

type RouteContext = { params: Promise<{ orgId: string; invitationId: string }> }

/**
 * DELETE /api/super/organizations/:orgId/invitations/:invitationId
 * Cancel a pending invitation (superadmin only)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId, invitationId } = await context.params

    await auth.api.cancelInvitation({
      headers: await headers(),
      body: { invitationId },
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} cancelled invitation ${invitationId} in org ${orgId}`
      )
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
