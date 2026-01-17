"use client"

import { ChartContainer } from "@/components/charts/chart-container"
import { AreaChart } from "@/components/charts/area-chart"

interface HistoricalDataPoint {
  month: string
  label: string
  totalExpenses: number
  expenseCount: number
  inventoryItems: number
  priceUpdates: number
}

interface ExpenseTrendChartProps {
  data: HistoricalDataPoint[]
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
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

  return (
    <ChartContainer
      title="Expense Trend"
      description="Monthly expenses over the last 6 months"
    >
      <AreaChart
        data={data}
        xKey="label"
        yKeys={["totalExpenses"]}
        yLabels={{ totalExpenses: "Total Expenses" }}
        height={220}
        formatYAxis={formatCurrency}
        formatTooltip={formatTooltip}
      />
    </ChartContainer>
  )
}
