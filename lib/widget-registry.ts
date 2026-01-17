/**
 * Widget Registry - Unified registry for KPI and Chart widgets
 *
 * Combines KPI definitions (from kpi-registry.ts) with chart definitions
 * for configurable dashboard layouts.
 */

export type WidgetCategory = "expense" | "inventory" | "super"
export type WidgetType = "kpi" | "chart"
export type KpiFormat = "currency" | "number" | "percent" | "text" | "ratio"

// KPI Widget Definition
export interface KpiWidgetDefinition {
  type: "kpi"
  label: string
  category: WidgetCategory
  format: KpiFormat
  description: string
  superOnly?: boolean
}

// Chart Widget Definition
export interface ChartWidgetDefinition {
  type: "chart"
  label: string
  category: WidgetCategory
  description: string
  component: string // Component name for dynamic rendering
  superOnly?: boolean
}

export type WidgetDefinition = KpiWidgetDefinition | ChartWidgetDefinition

// KPI Widgets
export const KPI_WIDGETS = {
  // Expense KPIs
  total_expenses: {
    type: "kpi",
    label: "Total Expenses",
    category: "expense",
    format: "currency",
    description: "Sum of all expenses for the period",
  },
  expense_count: {
    type: "kpi",
    label: "Expense Count",
    category: "expense",
    format: "number",
    description: "Number of expense entries",
  },
  avg_expense: {
    type: "kpi",
    label: "Avg Expense",
    category: "expense",
    format: "currency",
    description: "Average expense amount",
  },
  top_category: {
    type: "kpi",
    label: "Top Category",
    category: "expense",
    format: "text",
    description: "Category with highest spending",
  },
  mom_change: {
    type: "kpi",
    label: "MoM Change",
    category: "expense",
    format: "percent",
    description: "Month-over-month change in spending",
  },

  // Inventory KPIs
  inventory_items: {
    type: "kpi",
    label: "Inventory Items",
    category: "inventory",
    format: "number",
    description: "Total number of tracked items",
  },
  price_updates: {
    type: "kpi",
    label: "Price Updates",
    category: "inventory",
    format: "number",
    description: "Number of price changes this period",
  },
  top_increase: {
    type: "kpi",
    label: "Top Price Increase",
    category: "inventory",
    format: "percent",
    description: "Highest price increase percentage",
  },
  top_decrease: {
    type: "kpi",
    label: "Top Price Decrease",
    category: "inventory",
    format: "percent",
    description: "Highest price decrease percentage",
  },

  // Super-only KPIs
  org_count: {
    type: "kpi",
    label: "Organizations",
    category: "super",
    format: "number",
    description: "Total number of organizations",
    superOnly: true,
  },
  orgs_with_inventory: {
    type: "kpi",
    label: "Orgs w/ Inventory",
    category: "super",
    format: "ratio",
    description: "Organizations tracking inventory",
    superOnly: true,
  },
  avg_items_per_org: {
    type: "kpi",
    label: "Avg Items/Org",
    category: "super",
    format: "number",
    description: "Average inventory items per organization",
    superOnly: true,
  },
} as const satisfies Record<string, KpiWidgetDefinition>

// Chart Widgets
export const CHART_WIDGETS = {
  expense_trend: {
    type: "chart",
    label: "Expense Trend",
    category: "expense",
    description: "6-month expense trend area chart",
    component: "ExpenseTrendChart",
  },
  category_breakdown: {
    type: "chart",
    label: "Category Breakdown",
    category: "expense",
    description: "Spending by category bar chart",
    component: "CategoryChart",
  },
  price_movers: {
    type: "chart",
    label: "Price Changes",
    category: "inventory",
    description: "Top price movers bar chart",
    component: "PriceTrendChart",
  },

  // Super-only charts
  org_expenses: {
    type: "chart",
    label: "Expenses by Org",
    category: "super",
    description: "Spending per organization",
    component: "OrgExpenseChart",
    superOnly: true,
  },
  org_inventory: {
    type: "chart",
    label: "Inventory by Org",
    category: "super",
    description: "Items tracked per organization",
    component: "OrgInventoryChart",
    superOnly: true,
  },
} as const satisfies Record<string, ChartWidgetDefinition>

// Combined Widget Registry
export const WIDGET_REGISTRY = {
  ...KPI_WIDGETS,
  ...CHART_WIDGETS,
} as const

export type KpiWidgetId = keyof typeof KPI_WIDGETS
export type ChartWidgetId = keyof typeof CHART_WIDGETS
export type WidgetId = keyof typeof WIDGET_REGISTRY

// Type guard for KPI widgets
export function isKpiWidget(id: WidgetId): id is KpiWidgetId {
  return id in KPI_WIDGETS
}

// Type guard for chart widgets
export function isChartWidget(id: WidgetId): id is ChartWidgetId {
  return id in CHART_WIDGETS
}

// Get widgets by type
export function getKpiWidgetIds(): KpiWidgetId[] {
  return Object.keys(KPI_WIDGETS) as KpiWidgetId[]
}

export function getChartWidgetIds(): ChartWidgetId[] {
  return Object.keys(CHART_WIDGETS) as ChartWidgetId[]
}

// Get widgets available for org dashboard (excludes super-only)
export function getOrgAvailableKpis(): KpiWidgetId[] {
  return (Object.entries(KPI_WIDGETS) as [KpiWidgetId, KpiWidgetDefinition][])
    .filter(([, def]) => !def.superOnly)
    .map(([id]) => id)
}

export function getOrgAvailableCharts(): ChartWidgetId[] {
  return (Object.entries(CHART_WIDGETS) as [ChartWidgetId, ChartWidgetDefinition][])
    .filter(([, def]) => !def.superOnly)
    .map(([id]) => id)
}

// Get all widgets (for super dashboard)
export function getAllKpis(): KpiWidgetId[] {
  return Object.keys(KPI_WIDGETS) as KpiWidgetId[]
}

export function getAllCharts(): ChartWidgetId[] {
  return Object.keys(CHART_WIDGETS) as ChartWidgetId[]
}

// Get widgets by category
export function getWidgetsByCategory(
  category: WidgetCategory,
  type?: WidgetType
): WidgetId[] {
  return (Object.entries(WIDGET_REGISTRY) as [WidgetId, WidgetDefinition][])
    .filter(([, def]) => {
      if (def.category !== category) return false
      if (type && def.type !== type) return false
      return true
    })
    .map(([id]) => id)
}

// Format KPI value based on definition
export function formatKpiValue(
  id: KpiWidgetId,
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return "—"

  const def = KPI_WIDGETS[id]

  switch (def.format) {
    case "currency":
      return typeof value === "number"
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        : String(value)

    case "number":
      return typeof value === "number"
        ? new Intl.NumberFormat("en-US").format(value)
        : String(value)

    case "percent":
      return typeof value === "number"
        ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
        : String(value)

    case "ratio":
      return String(value)

    case "text":
    default:
      return String(value)
  }
}

// Default widget configurations
export const DEFAULT_ORG_KPIS: KpiWidgetId[] = [
  "total_expenses",
  "expense_count",
  "inventory_items",
  "price_updates",
]

export const DEFAULT_SUPER_KPIS: KpiWidgetId[] = [
  "total_expenses",
  "org_count",
  "inventory_items",
  "price_updates",
]

export const DEFAULT_ORG_CHARTS: ChartWidgetId[] = [
  "expense_trend",
  "category_breakdown",
]

export const DEFAULT_SUPER_CHARTS: ChartWidgetId[] = [
  "expense_trend",
  "org_expenses",
]
