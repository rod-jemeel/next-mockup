import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperInventoryContent, SuperInventoryContentSkeleton } from "./_components/super-inventory-content"
import { AdminInventoryDialog } from "./_components/admin-inventory-dialog"

export default function SuperInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    active?: string
    sort?: string
    order?: "asc" | "desc"
  }>
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/super">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">All Inventory Items</h1>
              <p className="text-xs text-muted-foreground">
                View inventory across all organizations
              </p>
            </div>
          </div>
        </div>
        <AdminInventoryDialog />
      </div>

      <Suspense fallback={<SuperInventoryContentSkeleton />}>
        <SuperInventoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
