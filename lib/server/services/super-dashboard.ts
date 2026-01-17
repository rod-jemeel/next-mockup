import { cache } from "react"
import { connection } from "next/server"
import { supabase } from "@/lib/server/db"
import { ApiError } from "@/lib/errors"

interface OrganizationSummary {
  id: string
  name: string
  slug: string
  memberCount: number
  createdAt: string
  // Enhanced metrics
  monthlyExpenses?: number
  inventoryItemCount?: number
  lastActivityAt?: string | null
}

interface OrgExpenseSummary {
  orgId: string
  orgName: string
  totalExpenses: number
  expenseCount: number
}

interface OrgInventorySummary {
  orgId: string
  orgName: string
  itemCount: number
  priceChangeCount: number
}

interface PriceMover {
  itemId: string
  itemName: string
  orgId: string
  orgName: string
  oldPrice: number
  newPrice: number
  changePercent: number
}

interface SuperDashboardData {
  month: string
  organizationCount: number
  totalExpenses: number
  totalExpenseCount: number
  orgBreakdown: OrgExpenseSummary[]
  // Inventory data
  totalInventoryItems: number
  totalPriceChanges: number
  inventoryByOrg: OrgInventorySummary[]
  topPriceMovers: PriceMover[]
}

/**
 * Get all organizations (for superadmin)
 * Uses React.cache() for per-request deduplication
 */
export const getAllOrganizations = cache(async function getAllOrganizations(): Promise<
  OrganizationSummary[]
> {
  // Mark as dynamic - needed before accessing new Date()
  await connection()

  // Get current month for expense calculations
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthStartStr = monthStart.toISOString().split("T")[0]
  const monthEndStr = monthEnd.toISOString().split("T")[0]

  // Fetch all data in parallel
  const [orgsResult, membersResult, expensesResult, itemsResult, activityResult] = await Promise.all([
    supabase
      .from("organization")
      .select("id, name, slug, createdAt")
      .order("createdAt", { ascending: false }),
    supabase
      .from("member")
      .select("organizationId"),
    supabase
      .from("expenses")
      .select("org_id, amount")
      .gte("expense_date", monthStartStr)
      .lte("expense_date", monthEndStr),
    supabase
      .from("inventory_items")
      .select("org_id, id")
      .eq("is_active", true),
    // Get last activity (most recent expense or price change per org)
    supabase
      .from("expenses")
      .select("org_id, created_at")
      .order("created_at", { ascending: false }),
  ])

  if (orgsResult.error) {
    console.error("Failed to fetch organizations:", orgsResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load organizations")
  }

  if (membersResult.error) {
    console.error("Failed to fetch members:", membersResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load member data")
  }

  const orgs = orgsResult.data || []
  const members = membersResult.data || []
  const expenses = expensesResult.data || []
  const items = itemsResult.data || []
  const activityRecords = activityResult.data || []

  // Count members per org
  const memberCounts = new Map<string, number>()
  for (const member of members) {
    const count = memberCounts.get(member.organizationId) || 0
    memberCounts.set(member.organizationId, count + 1)
  }

  // Sum expenses per org for current month
  const monthlyExpenses = new Map<string, number>()
  for (const expense of expenses) {
    const current = monthlyExpenses.get(expense.org_id) || 0
    monthlyExpenses.set(expense.org_id, current + Number(expense.amount))
  }

  // Count inventory items per org
  const itemCounts = new Map<string, number>()
  for (const item of items) {
    const count = itemCounts.get(item.org_id) || 0
    itemCounts.set(item.org_id, count + 1)
  }

  // Get last activity per org (first occurrence since sorted desc)
  const lastActivity = new Map<string, string>()
  for (const record of activityRecords) {
    if (!lastActivity.has(record.org_id)) {
      lastActivity.set(record.org_id, record.created_at)
    }
  }

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    memberCount: memberCounts.get(org.id) || 0,
    createdAt: org.createdAt,
    monthlyExpenses: monthlyExpenses.get(org.id) || 0,
    inventoryItemCount: itemCounts.get(org.id) || 0,
    lastActivityAt: lastActivity.get(org.id) || null,
  }))
})

/**
 * Get super dashboard data with cross-org aggregation
 * Uses React.cache() for per-request deduplication
 */
export const getSuperDashboard = cache(async function getSuperDashboard(data: {
  month: string // YYYY-MM format
}): Promise<SuperDashboardData> {
  const { month } = data

  // Parse month to get date range
  const [year, monthNum] = month.split("-").map(Number)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const startStr = startDate.toISOString().split("T")[0]
  const endStr = endDate.toISOString().split("T")[0]

  // Fetch organizations, expenses, inventory items, and price history in parallel
  const [orgsResult, expensesResult, itemsResult, priceHistoryResult] = await Promise.all([
    supabase.from("organization").select("id, name"),
    supabase
      .from("expenses")
      .select("id, amount, org_id")
      .gte("expense_date", startStr)
      .lte("expense_date", endStr),
    supabase.from("inventory_items").select("id, org_id, name"),
    supabase
      .from("inventory_price_history")
      .select("id, org_id, item_id, unit_price, effective_at")
      .gte("effective_at", startDate.toISOString())
      .lte("effective_at", endDate.toISOString())
      .order("effective_at", { ascending: false }),
  ])

  if (orgsResult.error) {
    console.error("Failed to fetch organizations:", orgsResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load organizations")
  }

  if (expensesResult.error) {
    console.error("Failed to fetch expenses:", expensesResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load expenses")
  }

  if (itemsResult.error) {
    console.error("Failed to fetch inventory items:", itemsResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load inventory items")
  }

  if (priceHistoryResult.error) {
    console.error("Failed to fetch price history:", priceHistoryResult.error)
    throw new ApiError("DATABASE_ERROR", "Failed to load price history")
  }

  const orgs = orgsResult.data || []
  const expenses = expensesResult.data || []
  const items = itemsResult.data || []
  const priceHistory = priceHistoryResult.data || []

  // Create org name lookup
  const orgNames = new Map<string, string>()
  for (const org of orgs) {
    orgNames.set(org.id, org.name)
  }

  // Create item name lookup
  const itemNames = new Map<string, { name: string; orgId: string }>()
  for (const item of items) {
    itemNames.set(item.id, { name: item.name, orgId: item.org_id })
  }

  // Aggregate expenses by org
  const orgExpenses = new Map<string, { total: number; count: number }>()
  let totalExpenses = 0
  let totalExpenseCount = 0

  for (const expense of expenses) {
    const orgId = expense.org_id
    const amount = Number(expense.amount)

    totalExpenses += amount
    totalExpenseCount += 1

    const existing = orgExpenses.get(orgId) || { total: 0, count: 0 }
    existing.total += amount
    existing.count += 1
    orgExpenses.set(orgId, existing)
  }

  // Build org breakdown sorted by total expenses (using toSorted for immutability)
  const orgBreakdown: OrgExpenseSummary[] = Array.from(orgExpenses.entries())
    .map(([orgId, { total, count }]) => ({
      orgId,
      orgName: orgNames.get(orgId) || "Unknown",
      totalExpenses: total,
      expenseCount: count,
    }))
    .toSorted((a, b) => b.totalExpenses - a.totalExpenses)

  // Aggregate inventory by org
  const orgInventory = new Map<string, { itemCount: number; priceChangeCount: number }>()
  for (const item of items) {
    const existing = orgInventory.get(item.org_id) || { itemCount: 0, priceChangeCount: 0 }
    existing.itemCount += 1
    orgInventory.set(item.org_id, existing)
  }

  // Count price changes per org
  for (const price of priceHistory) {
    const existing = orgInventory.get(price.org_id) || { itemCount: 0, priceChangeCount: 0 }
    existing.priceChangeCount += 1
    orgInventory.set(price.org_id, existing)
  }

  const inventoryByOrg: OrgInventorySummary[] = Array.from(orgInventory.entries())
    .map(([orgId, { itemCount, priceChangeCount }]) => ({
      orgId,
      orgName: orgNames.get(orgId) || "Unknown",
      itemCount,
      priceChangeCount,
    }))
    .toSorted((a, b) => b.itemCount - a.itemCount)

  // Find top price movers - get previous prices for comparison
  const priceMovers: PriceMover[] = []

  // Get unique items that had price changes this month
  const itemsWithChangesArray = Array.from(new Set(priceHistory.map((p) => p.item_id)))

  // Build a Map for O(1) lookup of current prices by item_id (fixes O(n²) .find() in loop)
  const currentPriceByItem = new Map<string, number>()
  for (const price of priceHistory) {
    // First occurrence is the latest (already sorted desc by effective_at)
    if (!currentPriceByItem.has(price.item_id)) {
      currentPriceByItem.set(price.item_id, Number(price.unit_price))
    }
  }

  // BATCH FETCH: Get all previous prices in ONE query instead of N queries (fixes N+1 waterfall)
  if (itemsWithChangesArray.length > 0) {
    const { data: allPreviousPrices } = await supabase
      .from("inventory_price_history")
      .select("item_id, unit_price, effective_at")
      .in("item_id", itemsWithChangesArray)
      .lt("effective_at", startDate.toISOString())
      .order("effective_at", { ascending: false })

    // Build Map of latest previous price per item
    const previousPriceByItem = new Map<string, number>()
    for (const price of allPreviousPrices || []) {
      // First occurrence per item is the latest (already sorted desc)
      if (!previousPriceByItem.has(price.item_id)) {
        previousPriceByItem.set(price.item_id, Number(price.unit_price))
      }
    }

    // Now process all items using Map lookups (O(1) per item)
    for (const itemId of itemsWithChangesArray) {
      const itemInfo = itemNames.get(itemId)
      if (!itemInfo) continue

      const newPrice = currentPriceByItem.get(itemId)
      const oldPrice = previousPriceByItem.get(itemId)

      if (newPrice !== undefined && oldPrice !== undefined && oldPrice > 0) {
        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100

        if (Math.abs(changePercent) > 0.1) {
          priceMovers.push({
            itemId,
            itemName: itemInfo.name,
            orgId: itemInfo.orgId,
            orgName: orgNames.get(itemInfo.orgId) || "Unknown",
            oldPrice,
            newPrice,
            changePercent,
          })
        }
      }
    }
  }

  // Sort by absolute change percent and take top 10 (using toSorted for immutability)
  const topPriceMovers = priceMovers
    .toSorted((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 10)

  return {
    month,
    organizationCount: orgs.length,
    totalExpenses,
    totalExpenseCount,
    orgBreakdown,
    totalInventoryItems: items.length,
    totalPriceChanges: priceHistory.length,
    inventoryByOrg,
    topPriceMovers,
  }
})

interface SuperHistoricalDataPoint {
  month: string // YYYY-MM format
  label: string // Display label (e.g., "Jan")
  totalExpenses: number
  expenseCount: number
  inventoryItems: number
  priceUpdates: number
  organizationCount: number
}

/**
 * Get historical super dashboard data for trend charts (last 6 months)
 * Uses React.cache() for per-request deduplication
 */
export const getSuperDashboardHistorical = cache(async function getSuperDashboardHistorical(data: {
  months?: number // Number of months to fetch (default 6)
}): Promise<SuperHistoricalDataPoint[]> {
  const { months = 6 } = data

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

  // Fetch all data in parallel
  const [orgsResult, expensesResult, itemsResult, priceHistoryResult] = await Promise.all([
    supabase.from("organization").select("id"),
    supabase
      .from("expenses")
      .select("id, amount, expense_date")
      .gte("expense_date", firstStart)
      .lte("expense_date", lastEnd),
    supabase.from("inventory_items").select("id"),
    supabase
      .from("inventory_price_history")
      .select("id, effective_at")
      .gte("effective_at", firstStart + "T00:00:00Z")
      .lte("effective_at", lastEnd + "T23:59:59Z"),
  ])

  const orgs = orgsResult.data || []
  const expenses = expensesResult.data || []
  const items = itemsResult.data || []
  const priceHistory = priceHistoryResult.data || []

  // Aggregate by month
  const result: SuperHistoricalDataPoint[] = monthRanges.map(({ month, label, startDate, endDate }) => {
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
      inventoryItems: items.length,
      priceUpdates: monthPriceUpdates.length,
      organizationCount: orgs.length,
    }
  })

  return result
})
