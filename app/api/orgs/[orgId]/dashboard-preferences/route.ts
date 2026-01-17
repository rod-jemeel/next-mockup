import { NextRequest } from "next/server"
import { z } from "zod"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import {
  getDashboardPreferences,
  updateDashboardPreferences,
  resetDashboardPreferences,
} from "@/lib/server/services/dashboard-preferences"
import { LAYOUT_PRESETS, DashboardPreferences } from "@/lib/layout-presets"

type RouteContext = { params: Promise<{ orgId: string }> }

// Validation schema for preferences update
const layoutPresetSchema = z.enum(["balanced", "kpi-focused", "chart-focused"])

const overviewSchema = z.object({
  layout: layoutPresetSchema,
  widgets: z.record(z.string(), z.string()),
})

const preferencesSchema = z.object({
  version: z.literal(1),
  overview: overviewSchema,
})

const patchSchema = z.object({
  overview: z
    .object({
      layout: layoutPresetSchema.optional(),
      widgets: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  reset: z.boolean().optional(),
})

/**
 * GET /api/orgs/:orgId/dashboard-preferences
 * Get dashboard preferences for the organization
 * Roles: any member
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    await requireOrgAccess(orgId)

    const { preferences, isDefault } = await getDashboardPreferences(orgId, "org")

    return Response.json({
      data: {
        preferences,
        isDefault,
        availableLayouts: Object.entries(LAYOUT_PRESETS).map(([id, config]) => ({
          id,
          label: config.label,
          description: config.description,
          slots: config.slots,
        })),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/orgs/:orgId/dashboard-preferences
 * Update dashboard preferences for the organization
 * Roles: org_admin, finance
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    await requireOrgAccess(orgId, ["org_admin", "finance"])

    const body = await request.json()
    const result = preferencesSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const preferences = await updateDashboardPreferences(
      orgId,
      result.data as DashboardPreferences
    )

    return Response.json({ data: { preferences } })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/orgs/:orgId/dashboard-preferences
 * Partial update or reset dashboard preferences
 * Roles: org_admin, finance
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    await requireOrgAccess(orgId, ["org_admin", "finance"])

    const body = await request.json()
    const result = patchSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    // Handle reset request
    if (result.data.reset) {
      const preferences = await resetDashboardPreferences(orgId, "org")
      return Response.json({ data: { preferences, wasReset: true } })
    }

    // Handle partial update
    if (result.data.overview) {
      const { preferences: currentPrefs } = await getDashboardPreferences(orgId, "org")

      const updatedPrefs: DashboardPreferences = {
        version: 1,
        overview: {
          layout: result.data.overview.layout ?? currentPrefs.overview.layout,
          widgets: {
            ...currentPrefs.overview.widgets,
            ...(result.data.overview.widgets ?? {}),
          },
        },
      }

      const preferences = await updateDashboardPreferences(orgId, updatedPrefs)
      return Response.json({ data: { preferences } })
    }

    // No changes requested
    const { preferences } = await getDashboardPreferences(orgId, "org")
    return Response.json({ data: { preferences } })
  } catch (error) {
    return handleError(error)
  }
}
