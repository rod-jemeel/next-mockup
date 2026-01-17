"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  format?: "currency" | "percent" | "number"
}

export function MetricCard({ label, value, change, format }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case "percent":
        return `${val.toFixed(1)}%`
      case "number":
      default:
        return new Intl.NumberFormat("en-US").format(val)
    }
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="size-3" />
    }
    return change > 0 ? (
      <TrendingUp className="size-3" />
    ) : (
      <TrendingDown className="size-3" />
    )
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground"
    return change > 0 ? "text-emerald-600" : "text-red-600"
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-slot="metric-card">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">
          {formatValue(value)}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              getTrendColor()
            )}
          >
            {getTrendIcon()}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
