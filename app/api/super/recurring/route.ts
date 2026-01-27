import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { createRecurringTemplateSchema } from "@/lib/validations/recurring-template"
import { createRecurringTemplate } from "@/lib/server/services/recurring-templates"
import { auth } from "@/lib/auth"

// Extended schema with orgId for superadmin
const superCreateRecurringSchema = createRecurringTemplateSchema.extend({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * POST /api/super/recurring
 * Create a recurring template for any organization (superadmin only)
 */
export async function POST(request: NextRequest) {
  // Mark route as dynamic - auth requires request headers
  await connection()

  try {
    const session = await requireSuperadmin()

    const body = await request.json()
    const result = superCreateRecurringSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...templateData } = result.data

    // Verify org exists
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId: orgId },
    })

    if (!org) {
      throw new ApiError("ORG_NOT_FOUND", "Organization not found")
    }

    const template = await createRecurringTemplate({
      input: templateData,
      orgId: org.id,
      userId: session.user.id,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} created recurring template in org ${org.name}: ${templateData.vendor || "unnamed"}`
      )
    })

    return Response.json({ data: template }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
