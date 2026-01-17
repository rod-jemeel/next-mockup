"use client"

import { BarChart3, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetricCard } from "./metric-card"
import { DataTable } from "./data-table"
import { TrendChart } from "./trend-chart"
import { ComparisonChart } from "./comparison-chart"

interface ResultsPanelProps {
  data: Record<string, unknown>
  onExport?: () => void
}

export function ResultsPanel({ data, onExport }: ResultsPanelProps) {
  const hasData = Object.keys(data).length > 0

  // Auto-detect and render appropriate visualizations based on data shape
  const renderVisualizations = () => {
    const components: React.ReactNode[] = []
    let keyIndex = 0

    // Check for summary metrics
    if (data.grandTotal !== undefined) {
      components.push(
        <MetricCard
          key={`metric-${keyIndex++}`}
          label="Total"
          value={data.grandTotal as number}
          format="currency"
        />
      )
    }

    if (data.totalCount !== undefined) {
      components.push(
        <MetricCard
          key={`metric-${keyIndex++}`}
          label="Count"
          value={data.totalCount as number}
          format="number"
        />
      )
    }

    // Check for monthly trend data
    if (Array.isArray(data.months) && data.months.length > 0) {
      // Only show trend chart if we have more than 1 data point (line charts need 2+ points)
      if (data.months.length > 1) {
        components.push(
          <TrendChart
            key={`trend-${keyIndex++}`}
            title="Monthly Trend"
            data={data.months as Record<string, unknown>[]}
            xKey="month"
            yKey="total"
            type="area"
          />
        )
      }

      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Monthly Breakdown"
          data={data.months as Record<string, unknown>[]}
          columns={[
            { key: "month", label: "Month" },
            { key: "total", label: "Total", format: "currency" },
            { key: "count", label: "Expenses", format: "number" },
          ]}
        />
      )
    }

    // Check for category breakdown
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      components.push(
        <ComparisonChart
          key={`comparison-${keyIndex++}`}
          title="Spending by Category"
          data={data.categories as Record<string, unknown>[]}
          labelKey="categoryName"
          valueKey="total"
        />
      )

      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Category Details"
          data={data.categories as Record<string, unknown>[]}
          columns={[
            { key: "categoryName", label: "Category" },
            { key: "total", label: "Total", format: "currency" },
            { key: "count", label: "Count", format: "number" },
            { key: "percentOfTotal", label: "% of Total", format: "percent" },
          ]}
        />
      )
    }

    // Check for vendor data
    if (Array.isArray(data.vendors) && data.vendors.length > 0) {
      components.push(
        <ComparisonChart
          key={`comparison-${keyIndex++}`}
          title="Top Vendors"
          data={data.vendors as Record<string, unknown>[]}
          labelKey="vendor"
          valueKey="total"
        />
      )

      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Vendor Details"
          data={data.vendors as Record<string, unknown>[]}
          columns={[
            { key: "vendor", label: "Vendor" },
            { key: "total", label: "Total Spend", format: "currency" },
            { key: "count", label: "Transactions", format: "number" },
          ]}
        />
      )
    }

    // Check for price changes
    if (Array.isArray(data.items) && data.items.length > 0) {
      const items = data.items as Record<string, unknown>[]
      const hasPriceChange = items[0]?.percentChange !== undefined

      if (hasPriceChange) {
        components.push(
          <ComparisonChart
            key={`comparison-${keyIndex++}`}
            title="Price Changes"
            data={items}
            labelKey="itemName"
            valueKey="percentChange"
          />
        )

        components.push(
          <DataTable
            key={`table-${keyIndex++}`}
            title="Price Change Details"
            data={items}
            columns={[
              { key: "itemName", label: "Item" },
              { key: "startPrice", label: "Start Price", format: "currency" },
              { key: "endPrice", label: "End Price", format: "currency" },
              { key: "percentChange", label: "Change %", format: "percent" },
            ]}
          />
        )
      } else {
        components.push(
          <DataTable
            key={`table-${keyIndex++}`}
            title="Items"
            data={items}
            columns={[
              { key: "name", label: "Name" },
              { key: "sku", label: "SKU" },
              { key: "unit", label: "Unit" },
            ]}
          />
        )
      }
    }

    // Check for price history
    if (Array.isArray(data.history) && data.history.length > 0) {
      // Only show trend chart if we have more than 1 data point (line charts need 2+ points)
      if (data.history.length > 1) {
        components.push(
          <TrendChart
            key={`trend-${keyIndex++}`}
            title={`Price History${data.itemName ? `: ${data.itemName}` : ""}`}
            data={data.history as Record<string, unknown>[]}
            xKey="effectiveAt"
            yKey="price"
            type="line"
          />
        )
      }

      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Price History Details"
          data={data.history as Record<string, unknown>[]}
          columns={[
            { key: "effectiveAt", label: "Date", format: "date" },
            { key: "price", label: "Price", format: "currency" },
            { key: "vendor", label: "Vendor" },
          ]}
        />
      )
    }

    // Check for cross-org comparisons
    if (Array.isArray(data.comparisons) && data.comparisons.length > 0) {
      components.push(
        <ComparisonChart
          key={`comparison-${keyIndex++}`}
          title="Cross-Organization Price Comparison"
          data={data.comparisons as Record<string, unknown>[]}
          labelKey="orgName"
          valueKey="currentPrice"
        />
      )

      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Organization Comparison"
          data={data.comparisons as Record<string, unknown>[]}
          columns={[
            { key: "orgName", label: "Organization" },
            { key: "itemName", label: "Item" },
            { key: "currentPrice", label: "Price", format: "currency" },
            { key: "vendor", label: "Vendor" },
          ]}
        />
      )
    }

    // Check for cross-org spending
    if (Array.isArray(data.spending) && data.spending.length > 0) {
      components.push(
        <ComparisonChart
          key={`comparison-${keyIndex++}`}
          title="Spending by Organization"
          data={data.spending as Record<string, unknown>[]}
          labelKey="orgName"
          valueKey="total"
        />
      )

      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Organization Spending"
          data={data.spending as Record<string, unknown>[]}
          columns={[
            { key: "orgName", label: "Organization" },
            { key: "total", label: "Total Spend", format: "currency" },
            { key: "count", label: "Expenses", format: "number" },
          ]}
        />
      )
    }

    // Check for single price data
    if (data.currentPrice !== undefined && data.itemName !== undefined) {
      components.push(
        <MetricCard
          key={`metric-${keyIndex++}`}
          label={data.itemName as string}
          value={data.currentPrice as number}
          format="currency"
        />
      )
    }

    // Check for recurring expense templates
    if (Array.isArray(data.templates) && data.templates.length > 0) {
      components.push(
        <DataTable
          key={`table-${keyIndex++}`}
          title="Recurring Expense Templates"
          data={data.templates as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Name" },
            { key: "vendor", label: "Vendor" },
            { key: "categoryName", label: "Category" },
            { key: "estimatedAmount", label: "Est. Amount", format: "currency" },
            { key: "frequency", label: "Frequency" },
          ]}
        />
      )
    }

    // Check for recurring expense history (template variation tracking)
    if (data.templateName !== undefined && data.summary !== undefined) {
      const summary = data.summary as Record<string, unknown>

      // Show summary metrics
      components.push(
        <MetricCard
          key={`metric-${keyIndex++}`}
          label={`${data.templateName} - Average`}
          value={summary.average as number}
          format="currency"
        />
      )

      // Show min/max range
      if (summary.min !== summary.max) {
        components.push(
          <MetricCard
            key={`metric-${keyIndex++}`}
            label="Monthly Range"
            value={`$${(summary.min as number).toFixed(2)} - $${(summary.max as number).toFixed(2)}`}
          />
        )
      }

      // Show trend chart if we have history with multiple points
      if (Array.isArray(data.history) && data.history.length > 1) {
        components.push(
          <TrendChart
            key={`trend-${keyIndex++}`}
            title={`${data.templateName} - Monthly Amounts`}
            data={data.history as Record<string, unknown>[]}
            xKey="month"
            yKey="amount"
            type="line"
          />
        )
      }

      // Show history table
      if (Array.isArray(data.history) && data.history.length > 0) {
        components.push(
          <DataTable
            key={`table-${keyIndex++}`}
            title="Payment History"
            data={data.history as Record<string, unknown>[]}
            columns={[
              { key: "date", label: "Date", format: "date" },
              { key: "amount", label: "Amount", format: "currency" },
              { key: "notes", label: "Notes" },
            ]}
          />
        )
      }
    }

    return components
  }

  const visualizations = renderVisualizations()

  return (
    <div className="flex flex-col h-full min-h-0" data-slot="results-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-sm font-medium text-foreground">Results</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasData ? "Query results and visualizations" : "Ask a question to see results"}
          </p>
        </div>
        {hasData && onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download />
            Export
          </Button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {hasData ? (
          <div className="flex flex-col gap-4">
            {visualizations.length > 0 ? (
              visualizations
            ) : (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="size-4" />
                  <span className="text-xs">
                    Data received but no visualizations available for this format.
                  </span>
                </div>
                <pre className="mt-4 text-xs text-muted-foreground overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No results yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Ask a question in the chat panel to see visualizations and data here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
