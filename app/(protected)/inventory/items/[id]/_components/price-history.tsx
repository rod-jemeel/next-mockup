import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { listPrices } from "@/lib/server/services/prices"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface PriceHistoryProps {
  itemId: string
  orgId: string
  unit: string
}

export async function PriceHistory({ itemId, orgId, unit }: PriceHistoryProps) {
  const data = await listPrices({
    query: { limit: 50 },
    itemId,
    orgId,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate price changes
  const pricesWithChange = data.items.map((price, index) => {
    const prevPrice = data.items[index + 1]
    let change = null
    let percentChange = null

    if (prevPrice) {
      change = price.unit_price - prevPrice.unit_price
      percentChange =
        prevPrice.unit_price !== 0
          ? (change / prevPrice.unit_price) * 100
          : null
    }

    return { ...price, change, percentChange }
  })

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-sm text-muted-foreground">No price history</p>
        <p className="text-xs text-muted-foreground">
          Add the first price entry to start tracking
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pricesWithChange.map((price) => (
            <TableRow key={price.id}>
              <TableCell className="text-xs">
                {formatDate(price.effective_at)}
              </TableCell>
              <TableCell className="font-medium text-xs">
                {formatCurrency(price.unit_price)}
                <span className="text-muted-foreground">/{unit}</span>
              </TableCell>
              <TableCell>
                {price.change !== null && price.percentChange !== null ? (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      price.change >= 0 ? "text-destructive" : "text-green-500"
                    }`}
                  >
                    {price.change >= 0 ? (
                      <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3" />
                    ) : (
                      <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3" />
                    )}
                    <span>
                      {price.change >= 0 ? "+" : ""}
                      {price.percentChange.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {price.vendor || "-"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {price.note || "-"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px]">
                  {price.source || "manual"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PriceHistorySkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
