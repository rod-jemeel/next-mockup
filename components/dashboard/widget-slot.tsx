"use client"

import { cn } from "@/lib/utils"
import {
  KpiWidgetId,
  ChartWidgetId,
  KPI_WIDGETS,
  CHART_WIDGETS,
  isKpiWidget,
  isChartWidget,
  formatKpiValue,
} from "@/lib/widget-registry"
import { SlotSize } from "@/lib/layout-presets"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

// KPI data getter type
export type KpiDataGetter = (kpiId: KpiWidgetId) => number | string | null
export type TrendDataGetter = (kpiId: KpiWidgetId) => number | null

interface WidgetSlotProps {
  widgetId: string
  size: SlotSize
  // For KPIs
  getKpiValue?: KpiDataGetter
  getTrend?: TrendDataGetter
  // For charts - pass the actual chart component or render function
  chartRenderer?: (chartId: ChartWidgetId) => React.ReactNode
  className?: string
}

/**
 * Renders a widget based on its ID and type
 * For KPIs, renders a card with value and optional trend
 * For charts, uses the provided chartRenderer
 */
export function WidgetSlot({
  widgetId,
  size,
  getKpiValue,
  getTrend,
  chartRenderer,
  className,
}: WidgetSlotProps) {
  // Determine if this is a KPI or chart widget
  if (isKpiWidget(widgetId as KpiWidgetId)) {
    const kpiId = widgetId as KpiWidgetId
    const value = getKpiValue?.(kpiId) ?? null
    const trend = getTrend?.(kpiId) ?? null

    return (
      <KpiWidget
        kpiId={kpiId}
        value={value}
        trend={trend}
        size={size}
        className={className}
      />
    )
  }

  if (isChartWidget(widgetId as ChartWidgetId)) {
    const chartId = widgetId as ChartWidgetId

    if (!chartRenderer) {
      return (
        <div
          className={cn(
            "rounded-lg border border-border bg-card p-4 flex items-center justify-center",
            getChartSizeClass(size),
            className
          )}
        >
          <span className="text-xs text-muted-foreground">
            {CHART_WIDGETS[chartId].label}
          </span>
        </div>
      )
    }

    return (
      <div className={cn(getChartSizeClass(size), className)}>
        {chartRenderer(chartId)}
      </div>
    )
  }

  // Unknown widget type
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/30 p-4 flex items-center justify-center",
        className
      )}
    >
      <span className="text-xs text-muted-foreground">Unknown widget</span>
    </div>
  )
}

interface KpiWidgetProps {
  kpiId: KpiWidgetId
  value: number | string | null
  trend: number | null
  size: SlotSize
  className?: string
}

function KpiWidget({ kpiId, value, trend, size, className }: KpiWidgetProps) {
  const definition = KPI_WIDGETS[kpiId]
  const formattedValue = formatKpiValue(kpiId, value)

  const getTrendIcon = () => {
    if (trend === null) return null
    if (trend > 0) return <TrendingUp className="size-3" />
    if (trend < 0) return <TrendingDown className="size-3" />
    return <Minus className="size-3" />
  }

  const getTrendColor = () => {
    if (trend === null) return ""
    // For expenses, down is good (green), up is neutral
    if (definition.category === "expense" && kpiId !== "inventory_items") {
      if (trend > 0) return "text-muted-foreground"
      if (trend < 0) return "text-emerald-600 dark:text-emerald-400"
    }
    // Default: up is good
    if (trend > 0) return "text-emerald-600 dark:text-emerald-400"
    if (trend < 0) return "text-red-600 dark:text-red-400"
    return "text-muted-foreground"
  }

  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4", className)}
    >
      <div className="text-xs text-muted-foreground font-medium mb-1">
        {definition.label}
      </div>
      <div className="text-2xl font-semibold text-foreground">
        {formattedValue}
      </div>
      {trend !== null && (
        <div
          className={cn("flex items-center gap-1 mt-1 text-xs", getTrendColor())}
        >
          {getTrendIcon()}
          <span>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  )
}

function getChartSizeClass(size: SlotSize): string {
  switch (size) {
    case "full":
      return "col-span-full"
    case "lg":
      return "col-span-1 md:col-span-2 lg:col-span-3"
    case "md":
      return "col-span-1 md:col-span-2"
    case "sm":
    default:
      return "col-span-1"
  }
}
