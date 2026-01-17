import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { inviteOrgAdminSchema } from "@/lib/validations/invitation"
import { auth } from "@/lib/auth"

type RouteContext = { params: Promise<{ orgId: string }> }

/**
 * POST /api/super/organizations/:orgId/invite
 * Invite an org_admin to an organization (superadmin only)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  // Mark route as dynamic - auth requires request headers
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId } = await context.params

    const body = await request.json()
    const result = inviteOrgAdminSchema.safeParse({
      ...body,
      organizationId: orgId,
    })

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { email, organizationId } = result.data

    // Create invitation using Better Auth API
    const invitation = await auth.api.createInvitation({
      headers: await headers(),
      body: {
        email,
        role: "org_admin",
        organizationId,
      },
    })

    // Log invitation (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} invited ${email} as org_admin to org ${organizationId}`
      )
    })

    return Response.json({ data: invitation }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
