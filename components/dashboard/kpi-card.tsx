import { cn } from "@/lib/utils"
import { KpiId, KPI_REGISTRY, formatKpiValue } from "@/lib/kpi-registry"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  kpiId: KpiId
  value: number | string | null | undefined
  trend?: number | null
  trendLabel?: string
  className?: string
}

export function KpiCard({
  kpiId,
  value,
  trend,
  trendLabel = "vs last month",
  className,
}: KpiCardProps) {
  const definition = KPI_REGISTRY[kpiId]
  const formattedValue = formatKpiValue(kpiId, value)

  const getTrendIcon = () => {
    if (trend === null || trend === undefined) return null
    if (trend > 0) return <TrendingUp className="size-3" />
    if (trend < 0) return <TrendingDown className="size-3" />
    return <Minus className="size-3" />
  }

  const getTrendColor = () => {
    if (trend === null || trend === undefined) return ""
    // For expenses, down is good (green), up is neutral
    // For inventory items, up is neutral
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
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="text-xs text-muted-foreground font-medium mb-1">
        {definition.label}
      </div>
      <div className="text-2xl font-semibold text-foreground">
        {formattedValue}
      </div>
      {trend !== null && trend !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 mt-1 text-xs",
            getTrendColor()
          )}
        >
          {getTrendIcon()}
          <span>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

interface KpiGridProps {
  children: React.ReactNode
  className?: string
}

export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {children}
    </div>
  )
}
