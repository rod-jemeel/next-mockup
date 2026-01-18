/**
 * Widget Registry - Unified registry for KPI, Chart, and Table widgets
 *
 * Combines KPI definitions with chart and table definitions
 * for configurable dashboard layouts.
 */

export type WidgetCategory = "expense" | "inventory" | "super"
export type WidgetType = "kpi" | "chart" | "table"
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

// Table Widget Definition
export interface TableWidgetDefinition {
  type: "table"
  label: string
  category: WidgetCategory
  description: string
  component: string // Component name for dynamic rendering
  superOnly?: boolean
}

export type WidgetDefinition = KpiWidgetDefinition | ChartWidgetDefinition | TableWidgetDefinition

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
  unique_vendors: {
    type: "kpi",
    label: "Unique Vendors",
    category: "expense",
    format: "number",
    description: "Number of different vendors",
  },
  largest_expense: {
    type: "kpi",
    label: "Largest Expense",
    category: "expense",
    format: "currency",
    description: "Highest single expense amount",
  },
  daily_avg: {
    type: "kpi",
    label: "Daily Average",
    category: "expense",
    format: "currency",
    description: "Average daily spending",
  },
  category_count: {
    type: "kpi",
    label: "Categories Used",
    category: "expense",
    format: "number",
    description: "Number of expense categories used",
  },
  total_tax: {
    type: "kpi",
    label: "Total Tax",
    category: "expense",
    format: "currency",
    description: "Sum of all tax paid for the period",
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
  active_items: {
    type: "kpi",
    label: "Active Items",
    category: "inventory",
    format: "number",
    description: "Number of active inventory items",
  },
  avg_price_change: {
    type: "kpi",
    label: "Avg Price Change",
    category: "inventory",
    format: "percent",
    description: "Average price change across items",
  },
  items_with_increase: {
    type: "kpi",
    label: "Items Up",
    category: "inventory",
    format: "number",
    description: "Items with price increases",
  },
  items_with_decrease: {
    type: "kpi",
    label: "Items Down",
    category: "inventory",
    format: "number",
    description: "Items with price decreases",
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
  // Expense Charts
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
  monthly_comparison: {
    type: "chart",
    label: "Monthly Comparison",
    category: "expense",
    description: "Current vs previous month side-by-side",
    component: "MonthlyComparisonChart",
  },
  vendor_breakdown: {
    type: "chart",
    label: "Top Vendors",
    category: "expense",
    description: "Spending by vendor bar chart",
    component: "VendorBreakdownChart",
  },
  daily_spending: {
    type: "chart",
    label: "Daily Spending",
    category: "expense",
    description: "Daily expense pattern this month",
    component: "DailySpendingChart",
  },
  category_trend: {
    type: "chart",
    label: "Category Trend",
    category: "expense",
    description: "Category spending over time",
    component: "CategoryTrendChart",
  },

  // Inventory Charts
  price_movers: {
    type: "chart",
    label: "Price Changes",
    category: "inventory",
    description: "Top price movers bar chart",
    component: "PriceTrendChart",
  },
  price_history: {
    type: "chart",
    label: "Price History",
    category: "inventory",
    description: "Price trends over time",
    component: "PriceHistoryChart",
  },
  price_volatility: {
    type: "chart",
    label: "Price Volatility",
    category: "inventory",
    description: "Items with most price fluctuation",
    component: "PriceVolatilityChart",
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
  org_activity: {
    type: "chart",
    label: "Org Activity",
    category: "super",
    description: "Activity levels across organizations",
    component: "OrgActivityChart",
    superOnly: true,
  },
} as const satisfies Record<string, ChartWidgetDefinition>

// Table Widgets
export const TABLE_WIDGETS = {
  // Expense Tables
  recent_expenses: {
    type: "table",
    label: "Recent Expenses",
    category: "expense",
    description: "Latest expense entries",
    component: "RecentExpensesTable",
  },
  top_vendors_table: {
    type: "table",
    label: "Top Vendors",
    category: "expense",
    description: "Vendors ranked by spending",
    component: "TopVendorsTable",
  },
  category_summary: {
    type: "table",
    label: "Category Summary",
    category: "expense",
    description: "Spending breakdown by category",
    component: "CategorySummaryTable",
  },

  // Inventory Tables
  recent_price_changes: {
    type: "table",
    label: "Recent Price Changes",
    category: "inventory",
    description: "Latest price updates",
    component: "RecentPriceChangesTable",
  },
  inventory_list: {
    type: "table",
    label: "Inventory List",
    category: "inventory",
    description: "All tracked items with prices",
    component: "InventoryListTable",
  },
  price_alerts: {
    type: "table",
    label: "Price Alerts",
    category: "inventory",
    description: "Items with significant price changes",
    component: "PriceAlertsTable",
  },

  // Super-only tables
  organization_list: {
    type: "table",
    label: "Organizations",
    category: "super",
    description: "All organizations with metrics",
    component: "OrganizationListTable",
    superOnly: true,
  },
  org_activity_feed: {
    type: "table",
    label: "Activity Feed",
    category: "super",
    description: "Recent activity across all orgs",
    component: "OrgActivityFeedTable",
    superOnly: true,
  },
} as const satisfies Record<string, TableWidgetDefinition>

// Combined Widget Registry
export const WIDGET_REGISTRY = {
  ...KPI_WIDGETS,
  ...CHART_WIDGETS,
  ...TABLE_WIDGETS,
} as const

export type KpiWidgetId = keyof typeof KPI_WIDGETS
export type ChartWidgetId = keyof typeof CHART_WIDGETS
export type TableWidgetId = keyof typeof TABLE_WIDGETS
export type WidgetId = keyof typeof WIDGET_REGISTRY

// Type guard for KPI widgets
export function isKpiWidget(id: WidgetId): id is KpiWidgetId {
  return id in KPI_WIDGETS
}

// Type guard for chart widgets
export function isChartWidget(id: WidgetId): id is ChartWidgetId {
  return id in CHART_WIDGETS
}

// Type guard for table widgets
export function isTableWidget(id: WidgetId): id is TableWidgetId {
  return id in TABLE_WIDGETS
}

// Get widgets by type
export function getKpiWidgetIds(): KpiWidgetId[] {
  return Object.keys(KPI_WIDGETS) as KpiWidgetId[]
}

export function getChartWidgetIds(): ChartWidgetId[] {
  return Object.keys(CHART_WIDGETS) as ChartWidgetId[]
}

export function getTableWidgetIds(): TableWidgetId[] {
  return Object.keys(TABLE_WIDGETS) as TableWidgetId[]
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

export function getOrgAvailableTables(): TableWidgetId[] {
  return (Object.entries(TABLE_WIDGETS) as [TableWidgetId, TableWidgetDefinition][])
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

export function getAllTables(): TableWidgetId[] {
  return Object.keys(TABLE_WIDGETS) as TableWidgetId[]
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

export const DEFAULT_ORG_TABLES: TableWidgetId[] = [
  "recent_expenses",
  "recent_price_changes",
]

export const DEFAULT_SUPER_TABLES: TableWidgetId[] = [
  "organization_list",
  "org_activity_feed",
]
