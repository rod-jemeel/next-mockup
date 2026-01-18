export type KpiCategory = "expense" | "inventory" | "super"
export type KpiFormat = "currency" | "number" | "percent" | "text" | "ratio"

export interface KpiDefinition {
  label: string
  category: KpiCategory
  format: KpiFormat
  description?: string
}

export const KPI_REGISTRY = {
  // Expense KPIs (both dashboards)
  total_expenses: {
    label: "Total Expenses",
    category: "expense",
    format: "currency",
    description: "Sum of all expenses for the period",
  },
  expense_count: {
    label: "Expense Count",
    category: "expense",
    format: "number",
    description: "Number of expense entries",
  },
  avg_expense: {
    label: "Avg Expense",
    category: "expense",
    format: "currency",
    description: "Average expense amount",
  },
  top_category: {
    label: "Top Category",
    category: "expense",
    format: "text",
    description: "Category with highest spending",
  },
  mom_change: {
    label: "MoM Change",
    category: "expense",
    format: "percent",
    description: "Month-over-month change in spending",
  },
  total_tax: {
    label: "Total Tax",
    category: "expense",
    format: "currency",
    description: "Sum of all tax paid for the period",
  },

  // Inventory KPIs (both dashboards)
  inventory_items: {
    label: "Inventory Items",
    category: "inventory",
    format: "number",
    description: "Total number of tracked items",
  },
  price_updates: {
    label: "Price Updates",
    category: "inventory",
    format: "number",
    description: "Number of price changes this period",
  },
  top_increase: {
    label: "Top Price Increase",
    category: "inventory",
    format: "percent",
    description: "Highest price increase percentage",
  },
  top_decrease: {
    label: "Top Price Decrease",
    category: "inventory",
    format: "percent",
    description: "Highest price decrease percentage",
  },

  // Super-only KPIs
  org_count: {
    label: "Organizations",
    category: "super",
    format: "number",
    description: "Total number of organizations",
  },
  orgs_with_inventory: {
    label: "Orgs w/ Inventory",
    category: "super",
    format: "ratio",
    description: "Organizations tracking inventory",
  },
  avg_items_per_org: {
    label: "Avg Items/Org",
    category: "super",
    format: "number",
    description: "Average inventory items per organization",
  },
} as const

export type KpiId = keyof typeof KPI_REGISTRY

// Default KPIs for each dashboard
export const DEFAULT_ORG_KPIS: KpiId[] = [
  "total_expenses",
  "expense_count",
  "inventory_items",
  "price_updates",
]

export const DEFAULT_SUPER_KPIS: KpiId[] = [
  "total_expenses",
  "org_count",
  "inventory_items",
  "price_updates",
]

// Get KPIs by category
export function getKpisByCategory(category: KpiCategory): KpiId[] {
  return (Object.entries(KPI_REGISTRY) as [KpiId, KpiDefinition][])
    .filter(([, def]) => def.category === category)
    .map(([id]) => id)
}

// Get all KPIs available for org dashboard (excludes super-only)
export function getOrgAvailableKpis(): KpiId[] {
  return (Object.entries(KPI_REGISTRY) as [KpiId, KpiDefinition][])
    .filter(([, def]) => def.category !== "super")
    .map(([id]) => id)
}

// Get all KPIs (for super dashboard)
export function getAllKpis(): KpiId[] {
  return Object.keys(KPI_REGISTRY) as KpiId[]
}

// Format KPI value based on definition
export function formatKpiValue(
  id: KpiId,
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return "—"

  const def = KPI_REGISTRY[id]

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
