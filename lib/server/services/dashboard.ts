import { cache } from "react"
import { supabase } from "@/lib/server/db"
import { ApiError } from "@/lib/errors"

interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  total: number
  count: number
  percentOfTotal: number
}

interface InventoryMover {
  itemId: string
  itemName: string
  startPrice: number
  endPrice: number
  change: number
  percentChange: number
}

interface DashboardData {
  month: string
  totalExpenses: number
  expenseCount: number
  momChange: number | null
  categoryBreakdown: CategoryBreakdown[]
  topDrivers: CategoryBreakdown[]
  inventoryMovers: InventoryMover[]
}

/**
 * Get dashboard data for a specific month
 * Uses React.cache() for per-request deduplication (server-cache-react rule)
 * Uses parallel fetching for independent operations (async-api-routes rule)
 */
export const getDashboard = cache(async function getDashboard(data: {
  month: string // YYYY-MM format
  compare?: "prev" | "none"
  orgId: string
}): Promise<DashboardData> {
  const { month, compare = "prev", orgId } = data

  // Parse month to get date range
  const [year, monthNum] = month.split("-").map(Number)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const startStr = startDate.toISOString().split("T")[0]
  const endStr = endDate.toISOString().split("T")[0]

  // Previous month date range (for MoM comparison)
  const prevMonth = new Date(year, monthNum - 2, 1)
  const prevEndDate = new Date(year, monthNum - 1, 0, 23, 59, 59, 999)
  const prevStartStr = prevMonth.toISOString().split("T")[0]
  const prevEndStr = prevEndDate.toISOString().split("T")[0]

  // Start all independent queries immediately (async-api-routes)
  const expensesPromise = supabase
    .from("expenses")
    .select("id, amount, category_id, expense_categories(id, name)")
    .eq("org_id", orgId)
    .gte("expense_date", startStr)
    .lte("expense_date", endStr)

  const prevExpensesPromise =
    compare === "prev"
      ? supabase
          .from("expenses")
          .select("amount")
          .eq("org_id", orgId)
          .gte("expense_date", prevStartStr)
          .lte("expense_date", prevEndStr)
      : Promise.resolve({ data: null })

  const inventoryMoversPromise = getInventoryMovers({
    orgId,
    startDate: startStr,
    endDate: endStr,
  })

  // Await all in parallel
  const [expensesResult, prevExpensesResult, inventoryMovers] = await Promise.all([
    expensesPromise,
    prevExpensesPromise,
    inventoryMoversPromise,
  ])

  if (expensesResult.error) {
    console.error("Failed to fetch expenses for dashboard:", expensesResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load dashboard data")
  }

  const expenses = expensesResult.data

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const expenseCount = expenses.length

  // Calculate category breakdown
  const categoryMap = new Map<
    string,
    { name: string; total: number; count: number }
  >()

  for (const expense of expenses) {
    const catId = expense.category_id
    const categories = expense.expense_categories as unknown as
      | { id: string; name: string }
      | null
    const catName = categories?.name || "Uncategorized"

    const existing = categoryMap.get(catId) || { name: catName, total: 0, count: 0 }
    existing.total += Number(expense.amount)
    existing.count += 1
    categoryMap.set(catId, existing)
  }

  const categoryBreakdown: CategoryBreakdown[] = Array.from(
    categoryMap.entries()
  )
    .map(([categoryId, { name, total, count }]) => ({
      categoryId,
      categoryName: name,
      total,
      count,
      percentOfTotal: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Top drivers: top 5 categories by spend
  const topDrivers = categoryBreakdown.slice(0, 5)

  // Calculate MoM change from pre-fetched data
  let momChange: number | null = null
  if (compare === "prev" && prevExpensesResult.data) {
    const prevTotal = prevExpensesResult.data.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    )
    if (prevTotal > 0) {
      momChange = ((totalExpenses - prevTotal) / prevTotal) * 100
    }
  }

  return {
    month,
    totalExpenses,
    expenseCount,
    momChange,
    categoryBreakdown,
    topDrivers,
    inventoryMovers,
  }
})

/**
 * Get inventory items with biggest price changes in a date range
 * Uses Promise.all to fetch all price data in parallel (async-parallel rule)
 */
async function getInventoryMovers(data: {
  orgId: string
  startDate: string
  endDate: string
}): Promise<InventoryMover[]> {
  const { orgId, startDate, endDate } = data

  // Get all items
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("is_active", true)

  if (!items || items.length === 0) {
    return []
  }

  // Fetch all start and end prices in parallel (async-parallel)
  const pricePromises = items.map(async (item) => {
    const [startResult, endResult] = await Promise.all([
      supabase
        .from("inventory_price_history")
        .select("unit_price")
        .eq("org_id", orgId)
        .eq("item_id", item.id)
        .lte("effective_at", startDate)
        .order("effective_at", { ascending: false })
        .limit(1),
      supabase
        .from("inventory_price_history")
        .select("unit_price")
        .eq("org_id", orgId)
        .eq("item_id", item.id)
        .lte("effective_at", endDate)
        .order("effective_at", { ascending: false })
        .limit(1),
    ])

    return { item, startPrices: startResult.data, endPrices: endResult.data }
  })

  const priceResults = await Promise.all(pricePromises)

  // Process results
  const movers: InventoryMover[] = []
  for (const { item, startPrices, endPrices } of priceResults) {
    if (startPrices?.length && endPrices?.length) {
      const startPrice = Number(startPrices[0].unit_price)
      const endPrice = Number(endPrices[0].unit_price)
      const change = endPrice - startPrice

      if (change !== 0 && startPrice > 0) {
        movers.push({
          itemId: item.id,
          itemName: item.name,
          startPrice,
          endPrice,
          change,
          percentChange: (change / startPrice) * 100,
        })
      }
    }
  }

  // Sort by absolute percent change and take top 10
  return movers
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 10)
}

interface HistoricalDataPoint {
  month: string // YYYY-MM format
  label: string // Display label (e.g., "Jan")
  totalExpenses: number
  expenseCount: number
  inventoryItems: number
  priceUpdates: number
}

/**
 * Get historical dashboard data for trend charts (last 6 months)
 * Uses React.cache() for per-request deduplication
 */
export const getDashboardHistorical = cache(async function getDashboardHistorical(data: {
  orgId: string
  months?: number // Number of months to fetch (default 6)
}): Promise<HistoricalDataPoint[]> {
  const { orgId, months = 6 } = data

  // Generate month ranges
  const now = new Date()
  const monthRanges: Array<{
    month: string
    label: string
    startDate: string
    endDate: string
  }> = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleString("en-US", { month: "short" })

    monthRanges.push({
      month: monthStr,
      label,
      startDate: date.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    })
  }

  // Get first and last date range
  const firstStart = monthRanges[0].startDate
  const lastEnd = monthRanges[monthRanges.length - 1].endDate

  // Fetch all expenses and inventory data in the date range
  const [expensesResult, itemsResult, priceHistoryResult] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, amount, expense_date")
      .eq("org_id", orgId)
      .gte("expense_date", firstStart)
      .lte("expense_date", lastEnd),
    supabase
      .from("inventory_items")
      .select("id, created_at")
      .eq("org_id", orgId)
      .eq("is_active", true),
    supabase
      .from("inventory_price_history")
      .select("id, effective_at")
      .eq("org_id", orgId)
      .gte("effective_at", firstStart + "T00:00:00Z")
      .lte("effective_at", lastEnd + "T23:59:59Z"),
  ])

  const expenses = expensesResult.data || []
  const items = itemsResult.data || []
  const priceHistory = priceHistoryResult.data || []

  // Aggregate by month
  const result: HistoricalDataPoint[] = monthRanges.map(({ month, label, startDate, endDate }) => {
    // Filter expenses for this month
    const monthExpenses = expenses.filter((e) => {
      const date = e.expense_date
      return date >= startDate && date <= endDate
    })

    // Filter price updates for this month
    const monthPriceUpdates = priceHistory.filter((p) => {
      const date = p.effective_at.split("T")[0]
      return date >= startDate && date <= endDate
    })

    return {
      month,
      label,
      totalExpenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      expenseCount: monthExpenses.length,
      inventoryItems: items.length, // Total items (doesn't change much month-to-month)
      priceUpdates: monthPriceUpdates.length,
    }
  })

  return result
})
