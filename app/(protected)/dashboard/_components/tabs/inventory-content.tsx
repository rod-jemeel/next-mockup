"use client"

import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card"
import { PriceTrendChart } from "../charts/price-trend-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface InventoryMover {
  itemId: string
  itemName: string
  startPrice: number
  endPrice: number
  change: number
  percentChange: number
}

interface InventoryData {
  totalItems: number
  priceUpdates: number
  topIncrease: { name: string; percent: number } | null
  topDecrease: { name: string; percent: number } | null
  movers: InventoryMover[]
}

interface InventoryContentProps {
  data: InventoryData
}

export function InventoryContent({ data }: InventoryContentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? "+" : ""
    return `${sign}${percent.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard kpiId="inventory_items" value={data.totalItems} />
        <KpiCard kpiId="price_updates" value={data.priceUpdates} />
        <KpiCard
          kpiId="top_increase"
          value={data.topIncrease?.percent ?? null}
        />
        <KpiCard
          kpiId="top_decrease"
          value={data.topDecrease?.percent ?? null}
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <PriceTrendChart data={data.movers} />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Price Movers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.movers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No significant price changes this month
              </p>
            ) : (
              <div className="space-y-3">
                {data.movers.slice(0, 5).map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between rounded-md border border-border p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium">
                        {item.itemName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(item.startPrice)} →{" "}
                        {formatCurrency(item.endPrice)}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        item.percentChange >= 0
                          ? "text-destructive"
                          : "text-green-500"
                      }`}
                    >
                      {item.percentChange >= 0 ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      <span>{formatPercent(item.percentChange)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
