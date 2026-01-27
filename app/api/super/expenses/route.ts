import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { createExpenseSchema } from "@/lib/validations/expense"
import { createExpense } from "@/lib/server/services/expenses"
import { auth } from "@/lib/auth"

// Extended schema with orgId for superadmin
const superCreateExpenseSchema = createExpenseSchema.extend({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * POST /api/super/expenses
 * Create an expense for any organization (superadmin only)
 */
export async function POST(request: NextRequest) {
  // Mark route as dynamic - auth requires request headers
  await connection()

  try {
    const session = await requireSuperadmin()

    const body = await request.json()
    const result = superCreateExpenseSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...expenseData } = result.data

    // Verify org exists
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId: orgId },
    })

    if (!org) {
      throw new ApiError("ORG_NOT_FOUND", "Organization not found")
    }

    // Get organization's default tax rate from metadata
    const metadata = org.metadata as Record<string, unknown> | undefined
    const defaultTaxRate =
      metadata && typeof metadata.defaultTaxRate === "number"
        ? metadata.defaultTaxRate
        : 0

    const expense = await createExpense({
      input: expenseData,
      orgId: org.id,
      userId: session.user.id,
      defaultTaxRate,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} created expense in org ${org.name}: $${expense.amount}`
      )
    })

    return Response.json({ data: expense }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
