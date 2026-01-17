"use client"

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Chart colors from CSS variables (fallback values for SSR)
const CHART_COLORS = [
  "hsl(36 100% 57%)",    // chart-1 - gold/orange
  "hsl(25 95% 53%)",     // chart-2 - orange
  "hsl(20 90% 48%)",     // chart-3 - red-orange
  "hsl(18 80% 40%)",     // chart-4 - dark orange
  "hsl(17 70% 35%)",     // chart-5 - brown-orange
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AreaChartProps {
  data: any[]
  xKey: string
  yKeys: string[]
  yLabels?: Record<string, string>
  height?: number
  showGrid?: boolean
  formatYAxis?: (value: number) => string
  formatTooltip?: (value: number) => string
  stacked?: boolean
}

export function AreaChart({
  data,
  xKey,
  yKeys,
  yLabels = {},
  height = 200,
  showGrid = true,
  formatYAxis = (v) => String(v),
  formatTooltip = (v) => String(v),
  stacked = false,
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
        )}
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
          tickFormatter={formatYAxis}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{
            color: "hsl(var(--popover-foreground))",
            fontWeight: 500,
            marginBottom: "4px",
            fontSize: "12px",
          }}
          itemStyle={{
            color: "hsl(var(--popover-foreground))",
            fontSize: "12px",
            padding: "2px 0",
          }}
          formatter={(value, name) => [
            formatTooltip(value as number),
            yLabels[name as string] || name,
          ]}
          separator=": "
        />
        {yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? "stack" : undefined}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
