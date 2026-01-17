import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { updateExpenseSchema } from "@/lib/validations/expense"
import {
  getExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/server/services/expenses"

type RouteContext = { params: Promise<{ orgId: string; expenseId: string }> }

/**
 * Get the default tax rate from organization metadata
 */
function getOrgDefaultTaxRate(org: { metadata?: unknown }): number {
  const metadata = org.metadata as Record<string, unknown> | undefined
  if (metadata && typeof metadata.defaultTaxRate === "number") {
    return metadata.defaultTaxRate
  }
  return 0
}

/**
 * GET /api/orgs/:orgId/expenses/:expenseId
 * Get a single expense
 * Roles: any member
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, expenseId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    const expense = await getExpense({
      expenseId,
      orgId: org.id,
    })

    return Response.json({ data: expense })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/orgs/:orgId/expenses/:expenseId
 * Update an expense
 * Roles: org_admin, finance
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, expenseId } = await context.params
    const { session, org } = await requireOrgAccess(orgId, ["org_admin", "finance"])

    const body = await request.json()
    const result = updateExpenseSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    // Get organization's default tax rate
    const defaultTaxRate = getOrgDefaultTaxRate(org)

    const expense = await updateExpense({
      expenseId,
      orgId: org.id,
      userId: session.user.id,
      input: result.data,
      defaultTaxRate,
    })

    return Response.json({ data: expense })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/orgs/:orgId/expenses/:expenseId
 * Delete an expense
 * Roles: org_admin only
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, expenseId } = await context.params
    const { session, org } = await requireOrgAccess(orgId, ["org_admin"])

    await deleteExpense({
      expenseId,
      orgId: org.id,
      userId: session.user.id,
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
