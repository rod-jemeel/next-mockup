"use client"

import { ChartContainer } from "@/components/charts/chart-container"
import { BarChart } from "@/components/charts/bar-chart"

interface CategoryData {
  categoryId: string
  categoryName: string
  total: number
  count: number
  percentOfTotal: number
}

interface CategoryChartProps {
  data: CategoryData[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`
    }
    return `$${value}`
  }

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Transform data for the chart - take top 5 categories
  const chartData = data.slice(0, 5).map((cat) => ({
    name: cat.categoryName.length > 12
      ? cat.categoryName.slice(0, 12) + "..."
      : cat.categoryName,
    amount: cat.total,
  }))

  return (
    <ChartContainer
      title="Expenses by Category"
      description="Top categories by spending"
    >
      <BarChart
        data={chartData}
        xKey="name"
        yKey="amount"
        yLabel="Total"
        height={220}
        formatYAxis={formatCurrency}
        formatTooltip={formatTooltip}
        horizontal
      />
    </ChartContainer>
  )
}
