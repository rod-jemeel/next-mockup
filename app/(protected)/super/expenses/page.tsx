import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperExpensesContent, SuperExpensesContentSkeleton } from "./_components/super-expenses-content"
import { AdminExpenseDialog } from "./_components/admin-expense-dialog"

export default function SuperExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string
    page?: string
    from?: string
    to?: string
    search?: string
    sort?: string
    order?: string
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
              <Receipt className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">All Expenses</h1>
              <p className="text-xs text-muted-foreground">
                View expenses across all organizations
              </p>
            </div>
          </div>
        </div>
        <AdminExpenseDialog />
      </div>

      <Suspense fallback={<SuperExpensesContentSkeleton />}>
        <SuperExpensesContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
