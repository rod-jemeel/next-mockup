"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { OverviewContent } from "./tabs/overview-content"
import { ExpensesContent } from "./tabs/expenses-content"
import { InventoryContent } from "./tabs/inventory-content"
import { KpiId } from "@/lib/kpi-registry"

interface HistoricalDataPoint {
  month: string
  label: string
  totalExpenses: number
  expenseCount: number
  inventoryItems: number
  priceUpdates: number
}

interface CategoryData {
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

interface DashboardClientProps {
  orgId: string
  dashboardData: {
    totalExpenses: number
    expenseCount: number
    momChange: number | null
    categoryBreakdown: CategoryData[]
    topDrivers: CategoryData[]
    inventoryMovers: InventoryMover[]
  }
  historicalData: HistoricalDataPoint[]
  inventoryItemCount: number
}

export function DashboardClient({
  orgId,
  dashboardData,
  historicalData,
  inventoryItemCount,
}: DashboardClientProps) {
  // Calculate derived data for KPIs
  const avgExpense =
    dashboardData.expenseCount > 0
      ? dashboardData.totalExpenses / dashboardData.expenseCount
      : 0

  const topCategory = dashboardData.topDrivers[0]?.categoryName ?? null

  // Find top increase and decrease
  const sortedMovers = [...dashboardData.inventoryMovers].sort(
    (a, b) => b.percentChange - a.percentChange
  )
  const topIncrease = sortedMovers.find((m) => m.percentChange > 0)
  const topDecrease = sortedMovers.find((m) => m.percentChange < 0)

  // KPI data for overview
  const kpiData = {
    total_expenses: dashboardData.totalExpenses,
    expense_count: dashboardData.expenseCount,
    avg_expense: avgExpense,
    top_category: topCategory,
    mom_change: dashboardData.momChange,
    inventory_items: inventoryItemCount,
    price_updates: dashboardData.inventoryMovers.length,
    top_increase: topIncrease?.percentChange ?? null,
    top_decrease: topDecrease?.percentChange ?? null,
  }

  // Trends (only expense-related have MoM)
  const trends: Record<KpiId, number | null> = {
    total_expenses: dashboardData.momChange,
    expense_count: null,
    avg_expense: null,
    top_category: null,
    mom_change: null,
    inventory_items: null,
    price_updates: null,
    top_increase: null,
    top_decrease: null,
    org_count: null,
    orgs_with_inventory: null,
    avg_items_per_org: null,
  }

  // Expense data for expenses tab
  const expenseData = {
    totalExpenses: dashboardData.totalExpenses,
    expenseCount: dashboardData.expenseCount,
    avgExpense,
    momChange: dashboardData.momChange,
    topCategory,
    categoryBreakdown: dashboardData.categoryBreakdown,
  }

  // Inventory data for inventory tab
  const inventoryData = {
    totalItems: inventoryItemCount,
    priceUpdates: dashboardData.inventoryMovers.length,
    topIncrease: topIncrease
      ? { name: topIncrease.itemName, percent: topIncrease.percentChange }
      : null,
    topDecrease: topDecrease
      ? { name: topDecrease.itemName, percent: topDecrease.percentChange }
      : null,
    movers: dashboardData.inventoryMovers,
  }

  return (
    <NuqsAdapter>
      <DashboardTabs
        overviewContent={
          <OverviewContent
            orgId={orgId}
            kpiData={kpiData}
            historicalData={historicalData}
            categoryData={dashboardData.categoryBreakdown}
            inventoryMovers={dashboardData.inventoryMovers}
            trends={trends}
          />
        }
        expensesContent={
          <ExpensesContent data={expenseData} historicalData={historicalData} />
        }
        inventoryContent={<InventoryContent data={inventoryData} />}
      />
    </NuqsAdapter>
  )
}
