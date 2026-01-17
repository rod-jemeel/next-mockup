import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { DeliveryBox01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { listItems } from "@/lib/server/services/inventory"
import { getCurrentPrice } from "@/lib/server/services/prices"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ItemListProps {
  orgId: string
  search?: string
}

export async function ItemList({ orgId, search }: ItemListProps) {
  const data = await listItems({
    query: { search, limit: 50 },
    orgId,
  })

  // Fetch current prices for all items in parallel
  const itemsWithPrices = await Promise.all(
    data.items.map(async (item) => {
      const price = await getCurrentPrice({ itemId: item.id, orgId })
      return { ...item, currentPrice: price }
    })
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <HugeiconsIcon icon={DeliveryBox01Icon} strokeWidth={2} className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No inventory items found</p>
        <p className="text-xs text-muted-foreground">
          Add your first item to start tracking prices
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {itemsWithPrices.map((item) => (
        <Link key={item.id} href={`/inventory/items/${item.id}`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <HugeiconsIcon icon={DeliveryBox01Icon} strokeWidth={2} className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {!item.is_active && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.sku && <span>SKU: {item.sku}</span>}
                  <span>Unit: {item.unit}</span>
                </div>
              </div>
              <div className="text-right">
                {item.currentPrice ? (
                  <>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.currentPrice.unit_price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      per {item.unit}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No price set</p>
                )}
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function ItemListSkeleton() {
  return (
    <div className="grid gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
            <Skeleton className="size-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
