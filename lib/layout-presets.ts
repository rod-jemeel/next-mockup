/**
 * Dashboard Layout Presets
 *
 * Defines configurable grid layouts for the dashboard overview tab.
 * Each preset specifies slots for KPIs and charts with their sizes.
 */

import {
  KpiWidgetId,
  ChartWidgetId,
  DEFAULT_ORG_KPIS,
  DEFAULT_ORG_CHARTS,
  DEFAULT_SUPER_KPIS,
  DEFAULT_SUPER_CHARTS,
} from "./widget-registry"

export type LayoutPreset = "balanced" | "kpi-focused" | "chart-focused"
export type SlotType = "kpi" | "chart"
export type SlotSize = "sm" | "md" | "lg" | "full"

export interface LayoutSlot {
  id: string
  type: SlotType
  size: SlotSize
}

export interface LayoutConfig {
  label: string
  description: string
  slots: LayoutSlot[]
}

/**
 * Layout Presets
 *
 * balanced: 4 KPIs in a row + 2 side-by-side charts (default)
 * kpi-focused: 6 KPIs in a grid + 1 full-width chart
 * chart-focused: 2 KPIs + 3 charts in various sizes
 */
export const LAYOUT_PRESETS: Record<LayoutPreset, LayoutConfig> = {
  balanced: {
    label: "Balanced",
    description: "4 KPIs + 2 charts",
    slots: [
      { id: "kpi-1", type: "kpi", size: "sm" },
      { id: "kpi-2", type: "kpi", size: "sm" },
      { id: "kpi-3", type: "kpi", size: "sm" },
      { id: "kpi-4", type: "kpi", size: "sm" },
      { id: "chart-1", type: "chart", size: "lg" },
      { id: "chart-2", type: "chart", size: "lg" },
    ],
  },
  "kpi-focused": {
    label: "KPI Focused",
    description: "6 KPIs + 1 chart",
    slots: [
      { id: "kpi-1", type: "kpi", size: "sm" },
      { id: "kpi-2", type: "kpi", size: "sm" },
      { id: "kpi-3", type: "kpi", size: "sm" },
      { id: "kpi-4", type: "kpi", size: "sm" },
      { id: "kpi-5", type: "kpi", size: "sm" },
      { id: "kpi-6", type: "kpi", size: "sm" },
      { id: "chart-1", type: "chart", size: "full" },
    ],
  },
  "chart-focused": {
    label: "Chart Focused",
    description: "2 KPIs + 3 charts",
    slots: [
      { id: "kpi-1", type: "kpi", size: "sm" },
      { id: "kpi-2", type: "kpi", size: "sm" },
      { id: "chart-1", type: "chart", size: "md" },
      { id: "chart-2", type: "chart", size: "md" },
      { id: "chart-3", type: "chart", size: "md" },
    ],
  },
}

/**
 * Dashboard Preferences Schema
 * Stored in organization.metadata.dashboardPreferences
 */
export interface DashboardPreferences {
  version: 1
  overview: {
    layout: LayoutPreset
    widgets: Record<string, string> // slotId -> widgetId
  }
}

/**
 * Get default widget assignments for a layout
 */
export function getDefaultWidgetAssignments(
  layout: LayoutPreset,
  variant: "org" | "super"
): Record<string, string> {
  const config = LAYOUT_PRESETS[layout]
  const defaultKpis = variant === "org" ? DEFAULT_ORG_KPIS : DEFAULT_SUPER_KPIS
  const defaultCharts = variant === "org" ? DEFAULT_ORG_CHARTS : DEFAULT_SUPER_CHARTS

  const assignments: Record<string, string> = {}
  let kpiIndex = 0
  let chartIndex = 0

  for (const slot of config.slots) {
    if (slot.type === "kpi") {
      // Cycle through available KPIs
      assignments[slot.id] = defaultKpis[kpiIndex % defaultKpis.length]
      kpiIndex++
    } else {
      // Cycle through available charts
      assignments[slot.id] = defaultCharts[chartIndex % defaultCharts.length]
      chartIndex++
    }
  }

  return assignments
}

/**
 * Get default preferences for a dashboard
 */
export function getDefaultPreferences(variant: "org" | "super"): DashboardPreferences {
  const layout: LayoutPreset = "balanced"
  return {
    version: 1,
    overview: {
      layout,
      widgets: getDefaultWidgetAssignments(layout, variant),
    },
  }
}

/**
 * Validate preferences against schema
 * Returns null if invalid, fixes minor issues
 */
export function validatePreferences(
  prefs: unknown,
  variant: "org" | "super"
): DashboardPreferences | null {
  if (!prefs || typeof prefs !== "object") {
    return null
  }

  const p = prefs as Record<string, unknown>

  // Check version
  if (p.version !== 1) {
    return null
  }

  // Check overview
  if (!p.overview || typeof p.overview !== "object") {
    return null
  }

  const overview = p.overview as Record<string, unknown>

  // Validate layout
  if (
    typeof overview.layout !== "string" ||
    !(overview.layout in LAYOUT_PRESETS)
  ) {
    return null
  }

  // Validate widgets
  if (!overview.widgets || typeof overview.widgets !== "object") {
    return null
  }

  const layout = overview.layout as LayoutPreset
  const layoutConfig = LAYOUT_PRESETS[layout]
  const widgets = overview.widgets as Record<string, string>

  // Ensure all slots have valid assignments
  const validatedWidgets: Record<string, string> = {}
  const defaultAssignments = getDefaultWidgetAssignments(layout, variant)

  for (const slot of layoutConfig.slots) {
    const widgetId = widgets[slot.id]
    if (typeof widgetId === "string" && widgetId.length > 0) {
      validatedWidgets[slot.id] = widgetId
    } else {
      // Use default if missing
      validatedWidgets[slot.id] = defaultAssignments[slot.id]
    }
  }

  return {
    version: 1,
    overview: {
      layout,
      widgets: validatedWidgets,
    },
  }
}

/**
 * Get the count of KPI slots and chart slots in a layout
 */
export function getLayoutSlotCounts(layout: LayoutPreset): {
  kpiCount: number
  chartCount: number
} {
  const config = LAYOUT_PRESETS[layout]
  return {
    kpiCount: config.slots.filter((s) => s.type === "kpi").length,
    chartCount: config.slots.filter((s) => s.type === "chart").length,
  }
}

/**
 * Get slots of a specific type from a layout
 */
export function getLayoutSlots(
  layout: LayoutPreset,
  type?: SlotType
): LayoutSlot[] {
  const config = LAYOUT_PRESETS[layout]
  if (type) {
    return config.slots.filter((s) => s.type === type)
  }
  return config.slots
}

/**
 * Extract widget IDs from preferences by type
 */
export function getWidgetsFromPreferences(
  prefs: DashboardPreferences,
  type: SlotType
): string[] {
  const slots = getLayoutSlots(prefs.overview.layout, type)
  return slots.map((slot) => prefs.overview.widgets[slot.id]).filter(Boolean)
}

/**
 * Get KPI widget IDs from preferences
 */
export function getKpiWidgetsFromPreferences(
  prefs: DashboardPreferences
): KpiWidgetId[] {
  return getWidgetsFromPreferences(prefs, "kpi") as KpiWidgetId[]
}

/**
 * Get chart widget IDs from preferences
 */
export function getChartWidgetsFromPreferences(
  prefs: DashboardPreferences
): ChartWidgetId[] {
  return getWidgetsFromPreferences(prefs, "chart") as ChartWidgetId[]
}
