import { NextRequest } from "next/server"
import { z } from "zod"
import { getAIQueryContext } from "@/lib/server/ai/permissions"
import { executeQuery, getAvailableTemplates } from "@/lib/server/ai/query-templates"
import { ApiError, handleError, validationError } from "@/lib/errors"
import type { QueryTemplateName } from "@/lib/ai/types"

const queryRequestSchema = z.object({
  template: z.string(),
  params: z.record(z.string(), z.unknown()),
})

/**
 * POST /api/ai/query
 * Execute a pre-defined query template
 * Auth: any authenticated user with org access
 */
export async function POST(request: NextRequest) {
  try {
    // Get AI query context (auth + permissions)
    const context = await getAIQueryContext()
    if (!context) {
      throw new ApiError("UNAUTHORIZED")
    }

    const body = await request.json()
    const parsed = queryRequestSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error.issues).toResponse()
    }

    const { template, params } = parsed.data

    // Validate template is available to user
    const availableTemplates = getAvailableTemplates(context)
    if (!availableTemplates.includes(template as QueryTemplateName)) {
      throw new ApiError("FORBIDDEN", `Query template '${template}' is not available`)
    }

    // Enforce org scope for non-super users
    if (context.scope === "org" && context.allowedOrgIds) {
      // For org-scoped queries, inject the org ID
      if (!params.orgId) {
        params.orgId = context.allowedOrgIds[0]
      } else if (!context.allowedOrgIds.includes(params.orgId as string)) {
        throw new ApiError("FORBIDDEN", "Access denied to organization")
      }
    }

    const result = await executeQuery(
      context,
      template as QueryTemplateName,
      params as never
    )

    if (result.error) {
      throw new ApiError("DATABASE_ERROR", result.error)
    }

    return Response.json({ data: result.data })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/ai/query
 * Get available query templates for the current user
 */
export async function GET() {
  try {
    const context = await getAIQueryContext()
    if (!context) {
      throw new ApiError("UNAUTHORIZED")
    }

    const templates = getAvailableTemplates(context)

    return Response.json({
      data: {
        templates,
        scope: context.scope,
        canCompareOrgs: context.canCompareOrgs,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
