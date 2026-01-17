"use client"

import { cn } from "@/lib/utils"
import { KpiGrid } from "./kpi-card"
import { DashboardSettings } from "./dashboard-settings"
import { WidgetSlot, KpiDataGetter, TrendDataGetter } from "./widget-slot"
import {
  DashboardPreferences,
  LAYOUT_PRESETS,
  getLayoutSlots,
  getKpiWidgetsFromPreferences,
  getChartWidgetsFromPreferences,
} from "@/lib/layout-presets"
import { ChartWidgetId, KpiWidgetId } from "@/lib/widget-registry"

interface ConfigurableOverviewProps {
  orgId: string
  preferences: DashboardPreferences
  isDefault: boolean
  variant?: "org" | "super"
  // Data providers
  getKpiValue: KpiDataGetter
  getTrend: TrendDataGetter
  // Chart renderers
  renderChart: (chartId: ChartWidgetId) => React.ReactNode
  className?: string
}

/**
 * Configurable dashboard overview that renders based on stored preferences
 */
export function ConfigurableOverview({
  orgId,
  preferences,
  isDefault,
  variant = "org",
  getKpiValue,
  getTrend,
  renderChart,
  className,
}: ConfigurableOverviewProps) {
  const layout = preferences.overview.layout
  const layoutConfig = LAYOUT_PRESETS[layout]
  const kpiSlots = getLayoutSlots(layout, "kpi")
  const chartSlots = getLayoutSlots(layout, "chart")

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with settings */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Key Metrics
        </h2>
        <DashboardSettings orgId={orgId} variant={variant} />
      </div>

      {/* KPI Grid */}
      <KpiGrid>
        {kpiSlots.map((slot) => {
          const widgetId = preferences.overview.widgets[slot.id]
          return (
            <WidgetSlot
              key={slot.id}
              widgetId={widgetId}
              size={slot.size}
              getKpiValue={getKpiValue}
              getTrend={getTrend}
            />
          )
        })}
      </KpiGrid>

      {/* Charts */}
      <div
        className={cn(
          "grid gap-4",
          chartSlots.length === 1
            ? "grid-cols-1"
            : chartSlots.length === 2
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {chartSlots.map((slot) => {
          const widgetId = preferences.overview.widgets[slot.id]
          return (
            <WidgetSlot
              key={slot.id}
              widgetId={widgetId}
              size={slot.size}
              chartRenderer={renderChart}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * Simple overview for when preferences are loading
 * Renders a basic layout with the default KPIs
 */
interface SimpleOverviewProps {
  kpiIds: KpiWidgetId[]
  getKpiValue: KpiDataGetter
  getTrend: TrendDataGetter
  renderChart: (chartId: ChartWidgetId) => React.ReactNode
  chartIds?: ChartWidgetId[]
  className?: string
}

export function SimpleOverview({
  kpiIds,
  getKpiValue,
  getTrend,
  renderChart,
  chartIds = ["expense_trend"],
  className,
}: SimpleOverviewProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-sm font-medium text-muted-foreground">Key Metrics</h2>

      {/* KPI Grid */}
      <KpiGrid>
        {kpiIds.map((kpiId) => (
          <WidgetSlot
            key={kpiId}
            widgetId={kpiId}
            size="sm"
            getKpiValue={getKpiValue}
            getTrend={getTrend}
          />
        ))}
      </KpiGrid>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {chartIds.map((chartId) => (
          <WidgetSlot
            key={chartId}
            widgetId={chartId}
            size="lg"
            chartRenderer={renderChart}
          />
        ))}
      </div>
    </div>
  )
}
