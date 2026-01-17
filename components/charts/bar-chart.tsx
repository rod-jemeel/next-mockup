"use client"

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
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
interface BarChartProps {
  data: any[]
  xKey: string
  yKey: string
  yLabel?: string  // Custom label for tooltip (defaults to yKey)
  height?: number
  showGrid?: boolean
  formatYAxis?: (value: number) => string
  formatTooltip?: (value: number) => string
  horizontal?: boolean
  colorByIndex?: boolean
}

export function BarChart({
  data,
  xKey,
  yKey,
  yLabel,
  height = 200,
  showGrid = true,
  formatYAxis = (v) => String(v),
  formatTooltip = (v) => String(v),
  horizontal = false,
  colorByIndex = true,
}: BarChartProps) {
  const tooltipLabel = yLabel || yKey
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

  const ChartComponent = horizontal ? (
    <RechartsBarChart
      data={data}
      layout="vertical"
      margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
    >
      {showGrid && (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          horizontal={false}
        />
      )}
      <XAxis
        type="number"
        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
        tickLine={false}
        axisLine={false}
        tickFormatter={formatYAxis}
      />
      <YAxis
        type="category"
        dataKey={xKey}
        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
        tickLine={false}
        axisLine={false}
        width={70}
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
        formatter={(value) => [formatTooltip(value as number), tooltipLabel]}
        separator=": "
      />
      <Bar dataKey={yKey} radius={[0, 4, 4, 0]}>
        {colorByIndex &&
          data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
      </Bar>
    </RechartsBarChart>
  ) : (
    <RechartsBarChart
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
        formatter={(value) => [formatTooltip(value as number), tooltipLabel]}
        separator=": "
      />
      <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
        {colorByIndex &&
          data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
      </Bar>
    </RechartsBarChart>
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      {ChartComponent}
    </ResponsiveContainer>
  )
}
