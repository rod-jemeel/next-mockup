import { z } from "zod"

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid("Invalid UUID format")

/**
 * ISO date string validation (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")

/**
 * ISO timestamp validation
 */
export const timestampSchema = z.string().datetime("Invalid ISO timestamp")

/**
 * Year-month validation (YYYY-MM)
 */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")

/**
 * Pagination parameters (supports both cursor and offset-based)
 */
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Date range filter parameters
 */
export const dateRangeSchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
})

/**
 * Currency code (ISO 4217)
 */
export const currencySchema = z
  .string()
  .length(3)
  .toUpperCase()
  .default("USD")

/**
 * Positive decimal amount
 */
export const amountSchema = z.coerce
  .number()
  .positive("Amount must be positive")
  .multipleOf(0.01, "Amount must have at most 2 decimal places")

/**
 * Positive unit price (4 decimal places for inventory)
 */
export const unitPriceSchema = z.coerce
  .number()
  .positive("Unit price must be positive")
  .multipleOf(0.0001, "Unit price must have at most 4 decimal places")

/**
 * Parse URL search params into an object
 */
export function parseSearchParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}
