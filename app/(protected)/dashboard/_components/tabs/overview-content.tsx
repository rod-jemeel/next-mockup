"use client"

import { useDashboardPreferences } from "@/lib/hooks/use-dashboard-preferences"
import {
  ConfigurableOverview,
  SimpleOverview,
} from "@/components/dashboard/configurable-overview"
import { KpiWidgetId, ChartWidgetId, DEFAULT_ORG_KPIS } from "@/lib/widget-registry"
import { ExpenseTrendChart } from "../charts/expense-trend-chart"
import { CategoryChart } from "../charts/category-chart"
import { PriceTrendChart } from "../charts/price-trend-chart"
import { Skeleton } from "@/components/ui/skeleton"

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

interface KpiData {
  total_expenses: number
  expense_count: number
  avg_expense: number
  top_category: string | null
  mom_change: number | null
  inventory_items: number
  price_updates: number
  top_increase: number | null
  top_decrease: number | null
}

interface OverviewContentProps {
  orgId: string
  kpiData: KpiData
  historicalData: HistoricalDataPoint[]
  categoryData: CategoryData[]
  inventoryMovers: InventoryMover[]
  trends: Record<KpiWidgetId, number | null>
}

export function OverviewContent({
  orgId,
  kpiData,
  historicalData,
  categoryData,
  inventoryMovers,
  trends,
}: OverviewContentProps) {
  const { preferences, isDefault, isLoading } = useDashboardPreferences(orgId, "org")

  // KPI value getter
  const getKpiValue = (kpiId: KpiWidgetId): number | string | null => {
    switch (kpiId) {
      case "total_expenses":
        return kpiData.total_expenses
      case "expense_count":
        return kpiData.expense_count
      case "avg_expense":
        return kpiData.avg_expense
      case "top_category":
        return kpiData.top_category
      case "mom_change":
        return kpiData.mom_change
      case "inventory_items":
        return kpiData.inventory_items
      case "price_updates":
        return kpiData.price_updates
      case "top_increase":
        return kpiData.top_increase
      case "top_decrease":
        return kpiData.top_decrease
      default:
        return null
    }
  }

  // Trend getter
  const getTrend = (kpiId: KpiWidgetId): number | null => {
    return trends[kpiId] ?? null
  }

  // Chart renderer
  const renderChart = (chartId: ChartWidgetId): React.ReactNode => {
    switch (chartId) {
      case "expense_trend":
        return <ExpenseTrendChart data={historicalData} />
      case "category_breakdown":
        return <CategoryChart data={categoryData} />
      case "price_movers":
        return <PriceTrendChart data={inventoryMovers} />
      default:
        return null
    }
  }

  // Show loading state
  if (isLoading) {
    return <OverviewSkeleton />
  }

  return (
    <ConfigurableOverview
      orgId={orgId}
      preferences={preferences}
      isDefault={isDefault}
      variant="org"
      getKpiValue={getKpiValue}
      getTrend={getTrend}
      renderChart={renderChart}
    />
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  )
}
