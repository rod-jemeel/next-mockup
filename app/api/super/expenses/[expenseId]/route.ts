import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError, ApiError } from "@/lib/errors"
import { updateExpenseSchema } from "@/lib/validations/expense"
import {
  updateExpense,
  deleteExpense,
  getExpense,
} from "@/lib/server/services/expenses"

// Extended schema with orgId for superadmin
const superUpdateExpenseSchema = updateExpenseSchema.extend({
  orgId: z.string().uuid("Invalid organization ID"),
})

const superDeleteSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
})

/**
 * PATCH /api/super/expenses/[expenseId]
 * Update an expense (superadmin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { expenseId } = await params

    const body = await request.json()
    const result = superUpdateExpenseSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...updateData } = result.data

    // Verify expense exists and belongs to org
    const existing = await getExpense({
      expenseId,
      orgId,
    })

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Expense not found")
    }

    const expense = await updateExpense({
      expenseId,
      orgId,
      userId: session.user.id,
      input: updateData,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} updated expense ${expenseId}`
      )
    })

    return Response.json({ data: expense })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/super/expenses/[expenseId]
 * Delete an expense (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  await connection()

  try {
    const session = await requireSuperadmin()
    const { expenseId } = await params

    const body = await request.json()
    const result = superDeleteSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId } = result.data

    await deleteExpense({
      expenseId,
      orgId,
      userId: session.user.id,
    })

    // Audit log (non-blocking)
    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} deleted expense ${expenseId}`
      )
    })

    return Response.json({ data: { deleted: true } })
  } catch (error) {
    return handleError(error)
  }
}
