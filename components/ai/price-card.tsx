"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface PriceCardProps {
  itemName: string
  currentPrice: number
  previousPrice?: number
  changePercent?: number
}

export function PriceCard({
  itemName,
  currentPrice,
  previousPrice,
  changePercent,
}: PriceCardProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)

  const change = changePercent ?? (previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : undefined)

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
    // For prices, going up is usually bad (red), going down is good (green)
    return change > 0 ? "text-red-600" : "text-emerald-600"
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-slot="price-card">
      <div className="text-xs text-muted-foreground mb-1 truncate">{itemName}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-foreground">
          {formatCurrency(currentPrice)}
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
      {previousPrice !== undefined && (
        <div className="text-xs text-muted-foreground mt-1">
          Previously {formatCurrency(previousPrice)}
        </div>
      )}
    </div>
  )
}
