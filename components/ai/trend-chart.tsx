"use client"

import {
  Area,
  Line,
  AreaChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Chart colors from CSS variables
const CHART_COLORS = [
  "hsl(36 100% 57%)",    // chart-1 - gold/orange
  "hsl(25 95% 53%)",     // chart-2 - orange
]

interface TrendChartProps {
  title: string
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  type?: "line" | "area"
}

export function TrendChart({
  title,
  data,
  xKey,
  yKey,
  type = "area",
}: TrendChartProps) {
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
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4" data-slot="trend-chart">
        <div className="text-sm font-medium text-foreground mb-3">{title}</div>
        <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  const Chart = type === "line" ? LineChart : AreaChart
  const DataComponent = type === "line" ? Line : Area

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-slot="trend-chart">
      <div className="text-sm font-medium text-foreground mb-4">{title}</div>
      <ResponsiveContainer width="100%" height={220}>
        <Chart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "8px 12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{
              color: "#111827",
              fontWeight: 500,
              marginBottom: "4px",
              fontSize: "12px",
            }}
            formatter={(value) => [formatTooltip(value as number), yKey]}
          />
          {type === "line" ? (
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={false}
            />
          ) : (
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={CHART_COLORS[0]}
              fill={CHART_COLORS[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}
