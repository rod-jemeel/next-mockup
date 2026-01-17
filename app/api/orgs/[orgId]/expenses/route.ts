import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { createExpenseSchema, listExpensesSchema } from "@/lib/validations/expense"
import { parseSearchParams } from "@/lib/validations/common"
import { createExpense, listExpenses } from "@/lib/server/services/expenses"

type RouteContext = { params: Promise<{ orgId: string }> }

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
 * POST /api/orgs/:orgId/expenses
 * Create a new expense
 * Roles: org_admin, finance
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    const { session, org } = await requireOrgAccess(orgId, [
      "org_admin",
      "finance",
    ])

    const body = await request.json()
    const result = createExpenseSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    // Get organization's default tax rate
    const defaultTaxRate = getOrgDefaultTaxRate(org)

    const expense = await createExpense({
      input: result.data,
      orgId: org.id,
      userId: session.user.id,
      defaultTaxRate,
    })

    return Response.json({ data: expense }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/orgs/:orgId/expenses
 * List expenses with optional filtering
 * Roles: any member
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    const params = parseSearchParams(new URL(request.url))
    const result = listExpensesSchema.safeParse(params)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const data = await listExpenses({
      query: result.data,
      orgId: org.id,
    })

    return Response.json({ data })
  } catch (error) {
    return handleError(error)
  }
}
