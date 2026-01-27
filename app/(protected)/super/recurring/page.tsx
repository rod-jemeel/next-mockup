import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperRecurringContent, SuperRecurringContentSkeleton } from "./_components/super-recurring-content"
import { AdminRecurringDialog } from "./_components/admin-recurring-dialog"

export default function SuperRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string
    page?: string
    active?: string
    search?: string
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
              <RefreshCw className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">All Recurring Templates</h1>
              <p className="text-xs text-muted-foreground">
                View recurring expense templates across all organizations
              </p>
            </div>
          </div>
        </div>
        <AdminRecurringDialog />
      </div>

      <Suspense fallback={<SuperRecurringContentSkeleton />}>
        <SuperRecurringContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
