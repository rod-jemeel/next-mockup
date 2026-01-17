"use client"

import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card"
import { ExpenseTrendChart } from "../charts/expense-trend-chart"
import { CategoryChart } from "../charts/category-chart"

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

interface ExpenseData {
  totalExpenses: number
  expenseCount: number
  avgExpense: number
  momChange: number | null
  topCategory: string | null
  categoryBreakdown: CategoryData[]
}

interface ExpensesContentProps {
  data: ExpenseData
  historicalData: HistoricalDataPoint[]
}

export function ExpensesContent({ data, historicalData }: ExpensesContentProps) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard
          kpiId="total_expenses"
          value={data.totalExpenses}
          trend={data.momChange}
        />
        <KpiCard kpiId="expense_count" value={data.expenseCount} />
        <KpiCard kpiId="avg_expense" value={data.avgExpense} />
        <KpiCard kpiId="top_category" value={data.topCategory} />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <ExpenseTrendChart data={historicalData} />
        <CategoryChart data={data.categoryBreakdown} />
      </div>
    </div>
  )
}
