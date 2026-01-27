import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { updateMemberRoleSchema } from "@/lib/validations/organization"
import { auth } from "@/lib/auth"

type RouteContext = { params: Promise<{ orgId: string; memberId: string }> }

/**
 * PATCH /api/super/organizations/:orgId/members/:memberId
 * Change a member's role (superadmin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId, memberId } = await context.params

    const body = await request.json()
    const result = updateMemberRoleSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { role } = result.data

    const updated = await auth.api.updateMemberRole({
      headers: await headers(),
      body: {
        memberId,
        role,
        organizationId: orgId,
      },
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} changed member ${memberId} role to ${role} in org ${orgId}`
      )
    })

    return Response.json({ data: updated })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/organizations/:orgId/members/:memberId
 * Remove a member from the organization (superadmin only)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId, memberId } = await context.params

    await auth.api.removeMember({
      headers: await headers(),
      body: {
        memberIdOrEmail: memberId,
        organizationId: orgId,
      },
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} removed member ${memberId} from org ${orgId}`
      )
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
