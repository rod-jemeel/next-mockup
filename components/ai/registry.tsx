"use client"

import type { UIComponent } from "@/lib/ai/types"
import { MetricCard } from "./metric-card"
import { PriceCard } from "./price-card"
import { DataTable } from "./data-table"
import { TrendChart } from "./trend-chart"
import { ComparisonChart } from "./comparison-chart"
import { InsightCard } from "./insight-card"
import { SuggestedQuery } from "./suggested-query"
import { ActionButton } from "./action-button"

interface RenderComponentProps {
  component: UIComponent
  data?: Record<string, unknown>
  onQuerySelect?: (query: string) => void
  onAction?: (action: string, params?: Record<string, string>) => void
}

/**
 * Render a UI component from the AI response
 */
export function RenderComponent({
  component,
  data,
  onQuerySelect,
  onAction,
}: RenderComponentProps) {
  switch (component.type) {
    case "MetricCard":
      return <MetricCard key={component.id} {...component.props} />

    case "PriceCard":
      return <PriceCard key={component.id} {...component.props} />

    case "DataTable": {
      const tableData = data?.[component.props.dataKey]
      return (
        <DataTable
          key={component.id}
          title={component.props.title}
          data={Array.isArray(tableData) ? tableData : []}
          columns={component.props.columns}
        />
      )
    }

    case "TrendChart": {
      const chartData = data?.[component.props.dataKey]
      return (
        <TrendChart
          key={component.id}
          title={component.props.title}
          data={Array.isArray(chartData) ? chartData : []}
          xKey={component.props.xKey}
          yKey={component.props.yKey}
          type={component.props.type || "area"}
        />
      )
    }

    case "ComparisonChart": {
      const chartData = data?.[component.props.dataKey]
      return (
        <ComparisonChart
          key={component.id}
          title={component.props.title}
          data={Array.isArray(chartData) ? chartData : []}
          labelKey={component.props.labelKey}
          valueKey={component.props.valueKey}
        />
      )
    }

    case "InsightCard":
      return <InsightCard key={component.id} {...component.props} />

    case "SuggestedQuery":
      return (
        <SuggestedQuery
          key={component.id}
          label={component.props.label}
          query={component.props.query}
          onClick={() => onQuerySelect?.(component.props.query)}
        />
      )

    case "ActionButton":
      return (
        <ActionButton
          key={component.id}
          label={component.props.label}
          action={component.props.action}
          onClick={() => onAction?.(component.props.action, component.props.params)}
        />
      )

    default:
      return null
  }
}

interface RenderComponentsProps {
  components: UIComponent[]
  data?: Record<string, unknown>
  onQuerySelect?: (query: string) => void
  onAction?: (action: string, params?: Record<string, string>) => void
}

/**
 * Render multiple UI components from the AI response
 */
export function RenderComponents({
  components,
  data,
  onQuerySelect,
  onAction,
}: RenderComponentsProps) {
  return (
    <div className="flex flex-col gap-4">
      {components.map((component) => (
        <RenderComponent
          key={component.id}
          component={component}
          data={data}
          onQuerySelect={onQuerySelect}
          onAction={onAction}
        />
      ))}
    </div>
  )
}
