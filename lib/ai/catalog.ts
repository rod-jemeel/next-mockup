/**
 * json-render Catalog
 * Defines the UI component schema that the AI can generate
 * Using @json-render/core for type-safe component definitions
 */

import { createCatalog, generateCatalogPrompt } from "@json-render/core"
import { z } from "zod"

/**
 * Component definitions with Zod schemas
 */
export const aiCatalog = createCatalog({
  name: "expense-tracker-ai",
  components: {
    MetricCard: {
      description: "Display a single metric value with optional change indicator",
      props: z.object({
        label: z.string().describe("Label for the metric"),
        value: z.union([z.string(), z.number()]).describe("The metric value to display"),
        change: z.number().optional().describe("Percentage change from previous period"),
        format: z
          .enum(["currency", "percent", "number"])
          .optional()
          .describe("How to format the value"),
      }),
    },

    PriceCard: {
      description: "Display an item price with change information",
      props: z.object({
        itemName: z.string().describe("Name of the inventory item"),
        currentPrice: z.number().describe("Current price"),
        previousPrice: z.number().optional().describe("Previous price for comparison"),
        changePercent: z.number().optional().describe("Percentage change"),
      }),
    },

    DataTable: {
      description: "Display tabular data with columns",
      props: z.object({
        title: z.string().describe("Table title"),
        dataKey: z.string().describe("Key to look up the data array in the response data"),
        columns: z
          .array(
            z.object({
              key: z.string(),
              label: z.string(),
              format: z.enum(["currency", "percent", "number", "date"]).optional(),
            })
          )
          .describe("Column definitions with key, label, and optional format"),
      }),
    },

    TrendChart: {
      description: "Display a line or area chart for time-series data",
      props: z.object({
        title: z.string().describe("Chart title"),
        dataKey: z.string().describe("Key to look up the data array in the response data"),
        xKey: z.string().describe("Key for x-axis values"),
        yKey: z.string().describe("Key for y-axis values"),
        type: z.enum(["line", "area"]).optional().describe("Chart type"),
      }),
    },

    ComparisonChart: {
      description: "Display a bar chart for comparing values across categories",
      props: z.object({
        title: z.string().describe("Chart title"),
        dataKey: z.string().describe("Key to look up the data array in the response data"),
        labelKey: z.string().describe("Key for category labels"),
        valueKey: z.string().describe("Key for values"),
      }),
    },

    InsightCard: {
      description: "Highlight an insight or recommendation",
      props: z.object({
        title: z.string().describe("Insight title"),
        description: z.string().describe("Insight description"),
        severity: z
          .enum(["info", "warning", "success", "error"])
          .optional()
          .describe("Severity level for visual styling"),
      }),
    },

    SuggestedQuery: {
      description: "Suggest a follow-up question the user might want to ask",
      props: z.object({
        label: z.string().describe("Display label"),
        query: z.string().describe("The suggested query text"),
      }),
    },

    ActionButton: {
      description: "An action button for user interaction",
      props: z.object({
        label: z.string().describe("Button label"),
        action: z
          .enum(["export_csv", "set_alert", "view_details"])
          .describe("Action to perform"),
        params: z.record(z.string(), z.string()).optional().describe("Optional parameters for the action"),
      }),
    },
  },
  actions: {
    export_csv: {
      description: "Export data to CSV file",
      params: z.object({
        dataKey: z.string().describe("Key of data to export"),
        filename: z.string().optional().describe("Filename for the export"),
      }),
    },
    set_alert: {
      description: "Set a price alert for an item",
      params: z.object({
        itemId: z.string().describe("Item ID to monitor"),
        threshold: z.number().describe("Price threshold"),
        direction: z.enum(["above", "below"]).describe("Alert when price goes above or below"),
      }),
    },
    view_details: {
      description: "View detailed information about an item",
      params: z.object({
        itemId: z.string().describe("Item ID to view"),
      }),
    },
  },
  validation: "warn",
})

/**
 * Export the catalog type for component registry
 */
export type AICatalog = typeof aiCatalog

/**
 * Generate a schema description for the AI system prompt
 * Uses json-render's built-in prompt generator
 */
export function getCatalogDescription(): string {
  return generateCatalogPrompt(aiCatalog)
}

/**
 * Infer component props types from the catalog
 */
export type MetricCardProps = z.infer<typeof aiCatalog.components.MetricCard.props>
export type PriceCardProps = z.infer<typeof aiCatalog.components.PriceCard.props>
export type DataTableProps = z.infer<typeof aiCatalog.components.DataTable.props>
export type TrendChartProps = z.infer<typeof aiCatalog.components.TrendChart.props>
export type ComparisonChartProps = z.infer<typeof aiCatalog.components.ComparisonChart.props>
export type InsightCardProps = z.infer<typeof aiCatalog.components.InsightCard.props>
export type SuggestedQueryProps = z.infer<typeof aiCatalog.components.SuggestedQuery.props>
export type ActionButtonProps = z.infer<typeof aiCatalog.components.ActionButton.props>
