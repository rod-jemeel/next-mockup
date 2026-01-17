import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Plus } from "lucide-react"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ExpenseFilters } from "./_components/expense-filters"
import { ExpenseList, ExpenseListSkeleton } from "./_components/expense-list"

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    categoryId?: string
  }>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  if (!session.session.activeOrganizationId) {
    redirect("/org/select")
  }

  const params = await searchParams
  const orgId = session.session.activeOrganizationId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Expenses</h1>
          <p className="text-xs text-muted-foreground">
            Manage your organization&apos;s expenses
          </p>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="/expenses/new">
            <Plus />
            Add Expense
          </Link>
        </Button>
      </div>

      <ExpenseFilters
        currentFrom={params.from}
        currentTo={params.to}
        currentCategoryId={params.categoryId}
        orgId={orgId}
      />

      <Suspense fallback={<ExpenseListSkeleton />}>
        <ExpenseList
          orgId={orgId}
          from={params.from}
          to={params.to}
          categoryId={params.categoryId}
        />
      </Suspense>
    </div>
  )
}
