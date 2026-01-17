import { supabase } from "@/lib/server/db"
import { ApiError } from "@/lib/errors"
import type {
  AddPriceInput,
  ListPricesQuery,
} from "@/lib/validations/inventory"

interface PriceRow {
  id: string
  org_id: string
  item_id: string
  vendor: string | null
  currency: string
  unit_price: number
  effective_at: string
  created_by: string
  created_at: string
  note: string | null
  source: string | null
}

/**
 * Add a new price entry (APPEND-ONLY - never update existing rows)
 */
export async function addPrice(data: {
  input: AddPriceInput
  itemId: string
  orgId: string
  userId: string
}) {
  const { input, itemId, orgId, userId } = data

  const { data: price, error } = await supabase
    .from("inventory_price_history")
    .insert({
      org_id: orgId,
      item_id: itemId,
      unit_price: input.unitPrice,
      currency: input.currency ?? "USD",
      effective_at: input.effectiveAt ?? new Date().toISOString(),
      vendor: input.vendor ?? null,
      note: input.note ?? null,
      source: input.source ?? "manual",
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to add price:", error)
    if (error.code === "23503") {
      throw new ApiError("ITEM_NOT_FOUND", "Inventory item not found")
    }
    throw new ApiError("DATABASE_ERROR", "Failed to add price")
  }

  return price as PriceRow
}

/**
 * Get price history for an item
 */
export async function listPrices(data: {
  query: ListPricesQuery
  itemId: string
  orgId: string
}) {
  const { query, itemId, orgId } = data

  let dbQuery = supabase
    .from("inventory_price_history")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .eq("item_id", itemId)
    .order("effective_at", { ascending: false })

  // Apply date range filters
  if (query.from) {
    dbQuery = dbQuery.gte("effective_at", query.from)
  }
  if (query.to) {
    dbQuery = dbQuery.lte("effective_at", query.to)
  }

  // Cursor-based pagination
  if (query.cursor) {
    dbQuery = dbQuery.lt("effective_at", query.cursor)
  }

  dbQuery = dbQuery.limit(query.limit)

  const { data: prices, error, count } = await dbQuery

  if (error) {
    console.error("Failed to list prices:", error)
    throw new ApiError("DATABASE_ERROR", "Failed to list prices")
  }

  const nextCursor =
    prices.length === query.limit
      ? prices[prices.length - 1]?.effective_at
      : undefined

  return {
    items: prices as PriceRow[],
    nextCursor,
    total: count ?? 0,
  }
}

/**
 * Get price at a specific point in time
 */
export async function getPriceAt(data: {
  timestamp: string
  itemId: string
  orgId: string
}) {
  const { timestamp, itemId, orgId } = data

  const { data: price, error } = await supabase
    .from("inventory_price_history")
    .select("*")
    .eq("org_id", orgId)
    .eq("item_id", itemId)
    .lte("effective_at", timestamp)
    .order("effective_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - no price recorded at that time
      return null
    }
    console.error("Failed to get price at timestamp:", error)
    throw new ApiError("DATABASE_ERROR", "Failed to get price")
  }

  return price as PriceRow
}

/**
 * Get the current (latest) price for an item
 */
export async function getCurrentPrice(data: { itemId: string; orgId: string }) {
  return getPriceAt({
    timestamp: new Date().toISOString(),
    itemId: data.itemId,
    orgId: data.orgId,
  })
}

/**
 * Calculate price change between two dates
 */
export async function getPriceChange(data: {
  itemId: string
  orgId: string
  startDate: string
  endDate: string
}) {
  const { itemId, orgId, startDate, endDate } = data

  const [startPrice, endPrice] = await Promise.all([
    getPriceAt({ timestamp: startDate, itemId, orgId }),
    getPriceAt({ timestamp: endDate, itemId, orgId }),
  ])

  if (!startPrice || !endPrice) {
    return null
  }

  const change = endPrice.unit_price - startPrice.unit_price
  const percentChange =
    startPrice.unit_price !== 0
      ? (change / startPrice.unit_price) * 100
      : null

  return {
    startPrice: startPrice.unit_price,
    endPrice: endPrice.unit_price,
    change,
    percentChange,
  }
}
