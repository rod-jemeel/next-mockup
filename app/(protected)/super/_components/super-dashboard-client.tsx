"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { OverviewContent } from "./tabs/overview-content"
import { ExpensesContent } from "./tabs/expenses-content"
import { InventoryContent } from "./tabs/inventory-content"

interface HistoricalDataPoint {
  month: string
  label: string
  totalExpenses: number
  expenseCount: number
  inventoryItems: number
  priceUpdates: number
  organizationCount: number
}

interface OrgExpenseData {
  orgId: string
  orgName: string
  totalExpenses: number
  expenseCount: number
}

interface OrgInventoryData {
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

interface SuperDashboardClientProps {
  dashboardData: {
    organizationCount: number
    totalExpenses: number
    totalExpenseCount: number
    orgBreakdown: OrgExpenseData[]
    totalInventoryItems: number
    totalPriceChanges: number
    inventoryByOrg: OrgInventoryData[]
    topPriceMovers: PriceMover[]
  }
  historicalData: HistoricalDataPoint[]
}

export function SuperDashboardClient({
  dashboardData,
  historicalData,
}: SuperDashboardClientProps) {
  // Calculate derived KPI values
  const avgPerOrg =
    dashboardData.organizationCount > 0
      ? dashboardData.totalExpenses / dashboardData.organizationCount
      : 0

  const orgsWithInventory = dashboardData.inventoryByOrg.filter(
    (org) => org.itemCount > 0
  ).length

  const avgItemsPerOrg =
    dashboardData.organizationCount > 0
      ? Math.round(
          dashboardData.totalInventoryItems / dashboardData.organizationCount
        )
      : 0

  // Find top increase and decrease (using toSorted for immutability)
  const sortedMovers = dashboardData.topPriceMovers.toSorted(
    (a, b) => b.changePercent - a.changePercent
  )
  const topIncrease = sortedMovers.find((m) => m.changePercent > 0)
  const topDecrease = sortedMovers.find((m) => m.changePercent < 0)

  // KPI data for overview
  const kpiData = {
    total_expenses: dashboardData.totalExpenses,
    expense_count: dashboardData.totalExpenseCount,
    avg_expense: avgPerOrg,
    top_category: null,
    mom_change: null,
    inventory_items: dashboardData.totalInventoryItems,
    price_updates: dashboardData.totalPriceChanges,
    top_increase: topIncrease?.changePercent ?? null,
    top_decrease: topDecrease?.changePercent ?? null,
    org_count: dashboardData.organizationCount,
    orgs_with_inventory: `${orgsWithInventory} / ${dashboardData.organizationCount}`,
    avg_items_per_org: avgItemsPerOrg,
  }

  // Expense data for expenses tab
  const expenseData = {
    totalExpenses: dashboardData.totalExpenses,
    expenseCount: dashboardData.totalExpenseCount,
    avgPerOrg,
    organizationCount: dashboardData.organizationCount,
    orgBreakdown: dashboardData.orgBreakdown,
  }

  // Inventory data for inventory tab
  const inventoryData = {
    totalItems: dashboardData.totalInventoryItems,
    priceUpdates: dashboardData.totalPriceChanges,
    organizationCount: dashboardData.organizationCount,
    orgsWithInventory,
    avgItemsPerOrg,
    inventoryByOrg: dashboardData.inventoryByOrg,
    topPriceMovers: dashboardData.topPriceMovers,
  }

  return (
    <NuqsAdapter>
      <DashboardTabs
        overviewContent={
          <OverviewContent kpiData={kpiData} historicalData={historicalData} />
        }
        expensesContent={
          <ExpensesContent data={expenseData} historicalData={historicalData} />
        }
        inventoryContent={<InventoryContent data={inventoryData} />}
      />
    </NuqsAdapter>
  )
}
