import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { renameOrganizationSchema } from "@/lib/validations/organization"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/server/db"

type RouteContext = { params: Promise<{ orgId: string }> }

const BUCKET_NAME = process.env.ATTACHMENTS_BUCKET || "attachments"

/**
 * PATCH /api/super/organizations/:orgId
 * Rename an organization (superadmin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId } = await context.params

    const body = await request.json()
    const result = renameOrganizationSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { name } = result.data

    const updated = await auth.api.updateOrganization({
      headers: await headers(),
      body: {
        organizationId: orgId,
        data: { name },
      },
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} renamed organization ${orgId} to "${name}"`
      )
    })

    return Response.json({ data: updated })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/organizations/:orgId
 * Delete an organization and all related data (superadmin only)
 * Storage files are cleaned up before deletion; DB CASCADE handles the rest.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId } = await context.params

    // Clean up Supabase Storage files first (not covered by DB CASCADE)
    const { data: attachments } = await supabase
      .from("attachments")
      .select("storage_path")
      .eq("org_id", orgId)

    if (attachments && attachments.length > 0) {
      const paths = attachments.map((a) => a.storage_path)
      await supabase.storage.from(BUCKET_NAME).remove(paths)
    }

    // Delete the organization via Better Auth (DB CASCADE handles related rows)
    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: orgId },
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted organization ${orgId}`
      )
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
