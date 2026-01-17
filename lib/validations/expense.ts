import { z } from "zod"
import {
  uuidSchema,
  dateSchema,
  amountSchema,
  paginationSchema,
  dateRangeSchema,
} from "./common"

/**
 * Tax amount schema - can be 0 or positive
 */
const taxAmountSchema = z.coerce
  .number()
  .min(0, "Tax amount cannot be negative")
  .multipleOf(0.01, "Tax amount must have at most 2 decimal places")

/**
 * Create expense request body
 * User enters totalAmount (what they paid)
 * taxAmount is auto-calculated from org default rate or user-adjusted
 * Server calculates: amountPreTax, effectiveTaxRate
 */
export const createExpenseSchema = z.object({
  expenseDate: dateSchema,
  categoryId: uuidSchema,
  totalAmount: amountSchema, // User enters total (what they paid)
  taxAmount: taxAmountSchema.optional(), // Auto-calc or user override
  vendor: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
  tagIds: z.array(uuidSchema).max(10).optional(),
  recurringTemplateId: uuidSchema.optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

/**
 * Update expense request body (all fields optional)
 */
export const updateExpenseSchema = z.object({
  expenseDate: dateSchema.optional(),
  categoryId: uuidSchema.optional(),
  totalAmount: amountSchema.optional(), // Update total amount
  taxAmount: taxAmountSchema.optional(), // Update tax amount
  vendor: z.string().max(255).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  tagIds: z.array(uuidSchema).max(10).optional(),
})

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

/**
 * List expenses query parameters
 */
export const listExpensesSchema = paginationSchema.merge(dateRangeSchema).extend({
  categoryId: uuidSchema.optional(),
  tagId: uuidSchema.optional(),
  vendor: z.string().max(255).optional(),
})

export type ListExpensesQuery = z.infer<typeof listExpensesSchema>
