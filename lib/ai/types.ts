/**
 * AI Feature Types
 * TypeScript types for AI analysis and RAG chat functionality
 */

// Permission context for AI queries
export interface AIQueryContext {
  scope: "org" | "global"
  allowedOrgIds: string[] | null // null = all orgs (super user)
  canCompareOrgs: boolean
  userId: string
  userName: string | null
  activeOrgId?: string // Active org for default queries (superadmin may have one)
}

// Chat message types
export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  ui?: UIComponent[] // AI-generated UI components
  data?: Record<string, unknown> // Query result data
  createdAt: Date
}

// UI Component types for json-render
export type UIComponentType =
  | "MetricCard"
  | "PriceCard"
  | "DataTable"
  | "TrendChart"
  | "ComparisonChart"
  | "InsightCard"
  | "SuggestedQuery"
  | "ActionButton"

export interface BaseUIComponent {
  type: UIComponentType
  id: string
}

export interface MetricCardComponent extends BaseUIComponent {
  type: "MetricCard"
  props: {
    label: string
    value: string | number
    change?: number
    format?: "currency" | "percent" | "number"
  }
}

export interface PriceCardComponent extends BaseUIComponent {
  type: "PriceCard"
  props: {
    itemName: string
    currentPrice: number
    previousPrice?: number
    changePercent?: number
  }
}

export interface DataTableComponent extends BaseUIComponent {
  type: "DataTable"
  props: {
    title: string
    dataKey: string // Key to look up in data
    columns: Array<{
      key: string
      label: string
      format?: "currency" | "percent" | "number" | "date"
    }>
  }
}

export interface TrendChartComponent extends BaseUIComponent {
  type: "TrendChart"
  props: {
    title: string
    dataKey: string // Key to look up in data
    xKey: string
    yKey: string
    type?: "line" | "area"
  }
}

export interface ComparisonChartComponent extends BaseUIComponent {
  type: "ComparisonChart"
  props: {
    title: string
    dataKey: string // Key to look up in data
    labelKey: string
    valueKey: string
  }
}

export interface InsightCardComponent extends BaseUIComponent {
  type: "InsightCard"
  props: {
    title: string
    description: string
    severity?: "info" | "warning" | "success" | "error"
  }
}

export interface SuggestedQueryComponent extends BaseUIComponent {
  type: "SuggestedQuery"
  props: {
    label: string
    query: string
  }
}

export interface ActionButtonComponent extends BaseUIComponent {
  type: "ActionButton"
  props: {
    label: string
    action: "export_csv" | "set_alert" | "view_details"
    params?: Record<string, string>
  }
}

export type UIComponent =
  | MetricCardComponent
  | PriceCardComponent
  | DataTableComponent
  | TrendChartComponent
  | ComparisonChartComponent
  | InsightCardComponent
  | SuggestedQueryComponent
  | ActionButtonComponent

// Query template types
export type QueryTemplateName =
  | "current_price"
  | "price_at_date"
  | "price_history"
  | "top_price_changes"
  | "monthly_expenses"
  | "expenses_by_category"
  | "top_vendors"
  | "search_items"
  | "recurring_templates"
  | "recurring_expense_history"
  | "cross_org_item_prices"
  | "cross_org_spending"

export interface QueryTemplateParams {
  current_price: { orgId: string; itemId: string }
  price_at_date: { orgId: string; itemId: string; date: string }
  price_history: { orgId: string; itemId: string; startDate: string }
  top_price_changes: { orgId: string; startDate: string; limit?: number }
  monthly_expenses: { orgId: string; startDate: string; endDate: string }
  expenses_by_category: { orgId: string; startDate: string; endDate: string }
  top_vendors: { orgId: string; startDate: string; endDate: string; limit?: number }
  search_items: { orgId: string; searchTerm: string }
  recurring_templates: { orgId: string }
  recurring_expense_history: { orgId: string; templateId: string; startDate: string; endDate: string }
  cross_org_item_prices: { itemName: string }
  cross_org_spending: { startDate: string; endDate: string }
}

// SSE event types for streaming
export type SSEEventType = "text" | "ui" | "data" | "error" | "done"

export interface SSEEvent {
  type: SSEEventType
  content?: string
  ui?: UIComponent[]
  data?: Record<string, unknown>
  error?: string
}

// Chat request/response types
export interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant"
    content: string
  }>
}

export interface QueryRequest {
  template: QueryTemplateName
  params: Record<string, unknown>
}
