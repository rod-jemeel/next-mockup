import { z } from "zod"
import {
  timestampSchema,
  unitPriceSchema,
  currencySchema,
  paginationSchema,
  dateRangeSchema,
} from "./common"

/**
 * Create inventory item request body
 */
export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  unit: z.string().min(1).max(50), // e.g. "kg", "pcs", "L"
})

export type CreateItemInput = z.infer<typeof createItemSchema>

/**
 * Update inventory item request body
 */
export const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().max(100).nullable().optional(),
  unit: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateItemInput = z.infer<typeof updateItemSchema>

/**
 * List inventory items query parameters
 */
export const listItemsSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
})

export type ListItemsQuery = z.infer<typeof listItemsSchema>

/**
 * Add price request body (append-only)
 */
export const addPriceSchema = z.object({
  unitPrice: unitPriceSchema,
  currency: currencySchema.optional(),
  effectiveAt: timestampSchema.optional(), // Defaults to now
  vendor: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
  source: z.string().max(100).optional(), // e.g. "manual", "import"
})

export type AddPriceInput = z.infer<typeof addPriceSchema>

/**
 * List price history query parameters
 */
export const listPricesSchema = paginationSchema.merge(dateRangeSchema)

export type ListPricesQuery = z.infer<typeof listPricesSchema>

/**
 * Get price at point-in-time query parameters
 */
export const priceAtSchema = z.object({
  at: timestampSchema,
})

export type PriceAtQuery = z.infer<typeof priceAtSchema>
