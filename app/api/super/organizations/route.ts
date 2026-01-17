import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { getAllOrganizations } from "@/lib/server/services/super-dashboard"
import { createOrganizationSchema } from "@/lib/validations/organization"
import { auth } from "@/lib/auth"

/**
 * GET /api/super/organizations
 * List all organizations (superadmin only)
 */
export async function GET() {
  // Mark route as dynamic - auth requires request headers
  await connection()

  try {
    await requireSuperadmin()

    const organizations = await getAllOrganizations()

    return Response.json({ data: organizations })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/super/organizations
 * Create a new organization (superadmin only)
 */
export async function POST(request: NextRequest) {
  // Mark route as dynamic - auth requires request headers
  await connection()

  try {
    const session = await requireSuperadmin()

    const body = await request.json()
    const result = createOrganizationSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { name, slug } = result.data

    // Create organization using Better Auth API
    const organization = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug,
      },
    })

    // Log organization creation (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} created organization: ${name} (${slug})`
      )
    })

    return Response.json({ data: organization }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
