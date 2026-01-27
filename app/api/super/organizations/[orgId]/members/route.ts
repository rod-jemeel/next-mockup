import { connection } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError } from "@/lib/errors"
import { auth } from "@/lib/auth"

type RouteContext = { params: Promise<{ orgId: string }> }

/**
 * GET /api/super/organizations/:orgId/members
 * List members + pending invitations (superadmin only)
 */
export async function GET(_request: Request, context: RouteContext) {
  await connection()

  try {
    await requireSuperadmin()
    const { orgId } = await context.params

    const [org, invitationsResult] = await Promise.all([
      auth.api.getFullOrganization({
        headers: await headers(),
        query: { organizationId: orgId },
      }),
      auth.api.listInvitations({
        headers: await headers(),
        query: { organizationId: orgId },
      }),
    ])

    const members = org?.members || []
    const invitations = (invitationsResult || []).filter(
      (inv: { status: string }) => inv.status === "pending"
    )

    return Response.json({ data: { members, invitations } })
  } catch (error) {
    return handleError(error)
  }
}
