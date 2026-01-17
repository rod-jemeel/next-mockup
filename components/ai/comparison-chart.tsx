"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Chart colors from CSS variables
const CHART_COLORS = [
  "hsl(36 100% 57%)",    // chart-1 - gold/orange
  "hsl(25 95% 53%)",     // chart-2 - orange
  "hsl(20 90% 48%)",     // chart-3 - red-orange
  "hsl(18 80% 40%)",     // chart-4 - dark orange
  "hsl(17 70% 35%)",     // chart-5 - brown-orange
]

interface ComparisonChartProps {
  title: string
  data: Record<string, unknown>[]
  labelKey: string
  valueKey: string
}

export function ComparisonChart({
  title,
  data,
  labelKey,
  valueKey,
}: ComparisonChartProps) {
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
      <div className="rounded-lg border border-border bg-card p-4" data-slot="comparison-chart">
        <div className="text-sm font-medium text-foreground mb-3">{title}</div>
        <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  // Use horizontal layout for better label readability
  const useHorizontal = data.length > 5

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-slot="comparison-chart">
      <div className="text-sm font-medium text-foreground mb-4">{title}</div>
      <ResponsiveContainer width="100%" height={useHorizontal ? Math.max(200, data.length * 40) : 220}>
        {useHorizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <YAxis
              type="category"
              dataKey={labelKey}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "8px 12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value) => [formatTooltip(value as number), valueKey]}
            />
            <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey={labelKey}
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
              formatter={(value) => [formatTooltip(value as number), valueKey]}
            />
            <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
