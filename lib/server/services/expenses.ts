import { cache } from "react"
import { supabase } from "@/lib/server/db"
import { ApiError } from "@/lib/errors"
import { logCreate, logUpdate, logDelete } from "./audit"
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
} from "@/lib/validations/expense"

interface ExpenseRow {
  id: string
  org_id: string
  expense_date: string
  category_id: string
  amount: number // Total amount (pre_tax + tax)
  amount_pre_tax: number
  tax_amount: number
  effective_tax_rate: number | null
  vendor: string | null
  notes: string | null
  recurring_template_id: string | null
  created_by: string
  created_at: string
}

interface ExpenseWithCategory extends ExpenseRow {
  expense_categories: { id: string; name: string } | null
}

/**
 * Calculate tax breakdown from total amount
 * @param totalAmount - Total amount paid (including tax)
 * @param taxAmount - Tax amount (if provided, otherwise calculated from rate)
 * @param defaultTaxRate - Organization's default tax rate (e.g., 0.0825 for 8.25%)
 */
function calculateTaxBreakdown(
  totalAmount: number,
  taxAmount?: number,
  defaultTaxRate: number = 0
): { amountPreTax: number; taxAmount: number; effectiveTaxRate: number } {
  // If tax amount is explicitly provided, use it
  if (taxAmount !== undefined && taxAmount >= 0) {
    const amountPreTax = Math.round((totalAmount - taxAmount) * 100) / 100
    const effectiveTaxRate =
      amountPreTax > 0
        ? Math.round((taxAmount / amountPreTax) * 10000) / 10000
        : 0
    return { amountPreTax, taxAmount, effectiveTaxRate }
  }

  // Calculate using default tax rate
  // If total = pre_tax * (1 + rate), then pre_tax = total / (1 + rate)
  if (defaultTaxRate > 0) {
    const amountPreTax =
      Math.round((totalAmount / (1 + defaultTaxRate)) * 100) / 100
    const calculatedTax = Math.round((totalAmount - amountPreTax) * 100) / 100
    return {
      amountPreTax,
      taxAmount: calculatedTax,
      effectiveTaxRate: defaultTaxRate,
    }
  }

  // No tax
  return {
    amountPreTax: totalAmount,
    taxAmount: 0,
    effectiveTaxRate: 0,
  }
}

/**
 * Create a new expense
 */
export async function createExpense(data: {
  input: CreateExpenseInput
  orgId: string
  userId: string
  defaultTaxRate?: number
}) {
  const { input, orgId, userId, defaultTaxRate = 0 } = data

  // Calculate tax breakdown
  const { amountPreTax, taxAmount, effectiveTaxRate } = calculateTaxBreakdown(
    input.totalAmount,
    input.taxAmount,
    defaultTaxRate
  )

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      org_id: orgId,
      expense_date: input.expenseDate,
      category_id: input.categoryId,
      amount: input.totalAmount, // Total amount
      amount_pre_tax: amountPreTax,
      tax_amount: taxAmount,
      effective_tax_rate: effectiveTaxRate,
      vendor: input.vendor ?? null,
      notes: input.notes ?? null,
      recurring_template_id: input.recurringTemplateId ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create expense:", error)
    throw new ApiError("DATABASE_ERROR", "Failed to create expense")
  }

  // Link tags if provided
  if (input.tagIds && input.tagIds.length > 0) {
    const tagLinks = input.tagIds.map((tagId) => ({
      expense_id: expense.id,
      tag_id: tagId,
    }))

    const { error: tagError } = await supabase
      .from("expense_tag_links")
      .insert(tagLinks)

    if (tagError) {
      console.error("Failed to link tags:", tagError)
      // Don't fail the request, tags are optional
    }
  }

  // Audit log (non-blocking)
  logCreate(orgId, userId, "expense", expense.id, {
    expense_date: input.expenseDate,
    category_id: input.categoryId,
    amount: input.totalAmount,
    amount_pre_tax: amountPreTax,
    tax_amount: taxAmount,
    vendor: input.vendor,
  })

  return expense as ExpenseRow
}

/**
 * List expenses with filtering and pagination
 * Uses React.cache() for per-request deduplication
 */
export const listExpenses = cache(async function listExpenses(data: {
  query: ListExpensesQuery
  orgId: string
}) {
  const { query, orgId } = data

  let dbQuery = supabase
    .from("expenses")
    .select("*, expense_categories(id, name)", { count: "exact" })
    .eq("org_id", orgId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })

  // Apply filters
  if (query.from) {
    dbQuery = dbQuery.gte("expense_date", query.from)
  }
  if (query.to) {
    dbQuery = dbQuery.lte("expense_date", query.to)
  }
  if (query.categoryId) {
    dbQuery = dbQuery.eq("category_id", query.categoryId)
  }
  if (query.vendor) {
    dbQuery = dbQuery.ilike("vendor", `%${query.vendor}%`)
  }

  // Support both cursor and offset-based pagination
  if (query.cursor) {
    dbQuery = dbQuery.lt("created_at", query.cursor)
  } else if (query.page && query.page > 1) {
    const offset = (query.page - 1) * query.limit
    dbQuery = dbQuery.range(offset, offset + query.limit - 1)
  }

  if (!query.page) {
    dbQuery = dbQuery.limit(query.limit)
  }

  const { data: expenses, error, count } = await dbQuery

  if (error) {
    console.error("Failed to list expenses:", error)
    throw new ApiError("DATABASE_ERROR", "Failed to list expenses")
  }

  // Filter by tag if specified (requires join through expense_tag_links)
  let filteredExpenses = expenses as ExpenseWithCategory[]
  if (query.tagId) {
    const { data: linkedIds } = await supabase
      .from("expense_tag_links")
      .select("expense_id")
      .eq("tag_id", query.tagId)

    if (linkedIds) {
      const idSet = new Set(linkedIds.map((l) => l.expense_id))
      filteredExpenses = filteredExpenses.filter((e) => idSet.has(e.id))
    }
  }

  // Determine next cursor
  const nextCursor =
    filteredExpenses.length === query.limit
      ? filteredExpenses[filteredExpenses.length - 1]?.created_at
      : undefined

  return {
    items: filteredExpenses,
    nextCursor,
    total: count ?? 0,
  }
})

/**
 * Get a single expense by ID
 */
export async function getExpense(data: { expenseId: string; orgId: string }) {
  const { expenseId, orgId } = data

  const { data: expense, error } = await supabase
    .from("expenses")
    .select("*, expense_categories(id, name)")
    .eq("id", expenseId)
    .eq("org_id", orgId)
    .single()

  if (error || !expense) {
    throw new ApiError("EXPENSE_NOT_FOUND")
  }

  return expense as ExpenseWithCategory
}

/**
 * Update an expense
 */
export async function updateExpense(data: {
  expenseId: string
  orgId: string
  userId: string
  input: UpdateExpenseInput
  defaultTaxRate?: number
}) {
  const { expenseId, orgId, userId, input, defaultTaxRate = 0 } = data

  // Get current expense for audit log and tax calculation
  const { data: oldExpense } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .eq("org_id", orgId)
    .single()

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {}
  if (input.expenseDate !== undefined) updateData.expense_date = input.expenseDate
  if (input.categoryId !== undefined) updateData.category_id = input.categoryId
  if (input.vendor !== undefined) updateData.vendor = input.vendor
  if (input.notes !== undefined) updateData.notes = input.notes

  // Handle amount and tax updates
  if (input.totalAmount !== undefined || input.taxAmount !== undefined) {
    // Use new total or existing total
    const totalAmount = input.totalAmount ?? oldExpense?.amount ?? 0
    // Use new tax or existing tax (if only tax is being updated)
    const taxAmount =
      input.taxAmount !== undefined
        ? input.taxAmount
        : input.totalAmount !== undefined
          ? undefined // Recalculate if total changed but no explicit tax
          : oldExpense?.tax_amount

    const { amountPreTax, taxAmount: calculatedTax, effectiveTaxRate } =
      calculateTaxBreakdown(totalAmount, taxAmount, defaultTaxRate)

    updateData.amount = totalAmount
    updateData.amount_pre_tax = amountPreTax
    updateData.tax_amount = calculatedTax
    updateData.effective_tax_rate = effectiveTaxRate
  }

  if (Object.keys(updateData).length === 0 && !input.tagIds) {
    throw new ApiError("VALIDATION_ERROR", "No fields to update")
  }

  // Update expense if there are fields to update
  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", expenseId)
      .eq("org_id", orgId)

    if (error) {
      console.error("Failed to update expense:", error)
      throw new ApiError("DATABASE_ERROR", "Failed to update expense")
    }
  }

  // Update tags if provided
  if (input.tagIds !== undefined) {
    // Remove existing tags
    await supabase
      .from("expense_tag_links")
      .delete()
      .eq("expense_id", expenseId)

    // Add new tags
    if (input.tagIds.length > 0) {
      const tagLinks = input.tagIds.map((tagId) => ({
        expense_id: expenseId,
        tag_id: tagId,
      }))

      await supabase.from("expense_tag_links").insert(tagLinks)
    }
  }

  // Get updated expense
  const updatedExpense = await getExpense({ expenseId, orgId })

  // Audit log (non-blocking)
  if (oldExpense) {
    logUpdate(orgId, userId, "expense", expenseId, oldExpense, {
      expense_date: updatedExpense.expense_date,
      category_id: updatedExpense.category_id,
      amount: updatedExpense.amount,
      amount_pre_tax: updatedExpense.amount_pre_tax,
      tax_amount: updatedExpense.tax_amount,
      vendor: updatedExpense.vendor,
    })
  }

  return updatedExpense
}

/**
 * Delete an expense
 */
export async function deleteExpense(data: {
  expenseId: string
  orgId: string
  userId: string
}) {
  const { expenseId, orgId, userId } = data

  // Get expense for audit log before deleting
  const { data: expense } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .eq("org_id", orgId)
    .single()

  // Delete tag links first
  await supabase.from("expense_tag_links").delete().eq("expense_id", expenseId)

  // Delete the expense
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("org_id", orgId)

  if (error) {
    console.error("Failed to delete expense:", error)
    throw new ApiError("DATABASE_ERROR", "Failed to delete expense")
  }

  // Audit log (non-blocking)
  if (expense) {
    logDelete(orgId, userId, "expense", expenseId, expense)
  }

  return { deleted: true }
}
