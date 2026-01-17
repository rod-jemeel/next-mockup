import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon, DollarCircleIcon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentPrice, getPriceChange } from "@/lib/server/services/prices"

interface CurrentPriceProps {
  itemId: string
  orgId: string
  unit: string
}

export async function CurrentPrice({ itemId, orgId, unit }: CurrentPriceProps) {
  const price = await getCurrentPrice({ itemId, orgId })

  // Calculate 30-day change
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const priceChange = await getPriceChange({
    itemId,
    orgId,
    startDate: thirtyDaysAgo.toISOString(),
    endDate: now.toISOString(),
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercent = (percent: number | null) => {
    if (percent === null) return "N/A"
    const sign = percent >= 0 ? "+" : ""
    return `${sign}${percent.toFixed(1)}%`
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Current Price
          </CardTitle>
          <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {price ? (
            <>
              <div className="text-xl font-bold">
                {formatCurrency(price.unit_price)}
              </div>
              <p className="text-xs text-muted-foreground">per {unit}</p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-muted-foreground">N/A</div>
              <p className="text-xs text-muted-foreground">No price set</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            30-Day Change
          </CardTitle>
          {priceChange && priceChange.percentChange !== null && (
            priceChange.percentChange >= 0 ? (
              <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4 text-destructive" />
            ) : (
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4 text-green-500" />
            )
          )}
        </CardHeader>
        <CardContent>
          {priceChange && priceChange.percentChange !== null ? (
            <>
              <div
                className={`text-xl font-bold ${
                  priceChange.percentChange >= 0
                    ? "text-destructive"
                    : "text-green-500"
                }`}
              >
                {formatPercent(priceChange.percentChange)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(priceChange.change)} change
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-muted-foreground">N/A</div>
              <p className="text-xs text-muted-foreground">Not enough data</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Last Updated
          </CardTitle>
        </CardHeader>
        <CardContent>
          {price ? (
            <>
              <div className="text-xl font-bold">
                {new Date(price.effective_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(price.effective_at).toLocaleDateString("en-US", {
                  year: "numeric",
                })}
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-muted-foreground">-</div>
              <p className="text-xs text-muted-foreground">No updates yet</p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export function CurrentPriceSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-7 w-24" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
