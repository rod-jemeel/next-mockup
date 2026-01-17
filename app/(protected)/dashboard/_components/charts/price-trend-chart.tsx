"use client"

import { ChartContainer } from "@/components/charts/chart-container"
import { BarChart } from "@/components/charts/bar-chart"

interface InventoryMover {
  itemId: string
  itemName: string
  startPrice: number
  endPrice: number
  change: number
  percentChange: number
}

interface PriceTrendChartProps {
  data: InventoryMover[]
}

export function PriceTrendChart({ data }: PriceTrendChartProps) {
  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`
  }

  // Transform data for the chart - take top 5 movers
  const chartData = data.slice(0, 5).map((item) => ({
    name: item.itemName.length > 15
      ? item.itemName.slice(0, 15) + "..."
      : item.itemName,
    change: item.percentChange,
  }))

  if (chartData.length === 0) {
    return (
      <ChartContainer
        title="Price Changes"
        description="Top price movers this period"
      >
        <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
          No price changes recorded
        </div>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer
      title="Price Changes"
      description="Top price movers this period"
    >
      <BarChart
        data={chartData}
        xKey="name"
        yKey="change"
        height={220}
        formatYAxis={formatPercent}
        formatTooltip={formatPercent}
        horizontal
      />
    </ChartContainer>
  )
}
