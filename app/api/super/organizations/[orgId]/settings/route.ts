import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { updateOrgSettingsSchema } from "@/lib/validations/organization"
import { auth } from "@/lib/auth"

type RouteContext = { params: Promise<{ orgId: string }> }

/**
 * GET /api/super/organizations/:orgId/settings
 * Fetch organization settings (superadmin only)
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  await connection()

  try {
    await requireSuperadmin()
    const { orgId } = await context.params

    const org = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId: orgId },
    })

    if (!org) {
      throw new ApiError("ORG_NOT_FOUND")
    }

    const metadata = (org.metadata || {}) as Record<string, unknown>

    return Response.json({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        defaultTaxRate: metadata.defaultTaxRate ?? 0,
        createdAt: org.createdAt,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/super/organizations/:orgId/settings
 * Update organization settings (superadmin only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { orgId } = await context.params

    const org = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId: orgId },
    })

    if (!org) {
      throw new ApiError("ORG_NOT_FOUND")
    }

    const body = await request.json()
    const result = updateOrgSettingsSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { name, defaultTaxRate } = result.data

    const updateData: {
      name?: string
      metadata?: Record<string, unknown>
    } = {}

    if (name !== undefined) {
      updateData.name = name
    }

    if (defaultTaxRate !== undefined) {
      const existingMetadata = (org.metadata || {}) as Record<string, unknown>
      updateData.metadata = {
        ...existingMetadata,
        defaultTaxRate,
      }
    }

    const updatedOrg = await auth.api.updateOrganization({
      headers: await headers(),
      body: {
        organizationId: orgId,
        data: updateData,
      },
    })

    if (!updatedOrg) {
      throw new ApiError("DATABASE_ERROR", "Failed to update organization")
    }

    const metadata = (updatedOrg.metadata || {}) as Record<string, unknown>

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated settings for organization ${orgId}`
      )
    })

    return Response.json({
      data: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug,
        defaultTaxRate: metadata.defaultTaxRate ?? 0,
        createdAt: updatedOrg.createdAt,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
