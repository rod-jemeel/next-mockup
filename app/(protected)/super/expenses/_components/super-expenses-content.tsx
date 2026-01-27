import { listAllExpenses, getAllExpenseStats } from "@/lib/server/services/expenses"
import { SuperExpensesContentClient, SuperExpensesContentSkeleton } from "./super-expenses-content-client"

interface SuperExpensesContentProps {
  searchParams: Promise<{
    org?: string
    page?: string
    from?: string
    to?: string
    search?: string
    sort?: string
    order?: string
  }>
}

export async function SuperExpensesContent({ searchParams }: SuperExpensesContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const search = params.search
  const sortBy = (params.sort || "expense_date") as "expense_date" | "amount" | "vendor"
  const sortOrder = (params.order || "desc") as "asc" | "desc"

  const [expensesData, statsData] = await Promise.all([
    listAllExpenses({
      query: {
        page,
        limit: 20,
        orgId,
        from: params.from,
        to: params.to,
        search,
        sortBy,
        sortOrder,
      },
    }),
    getAllExpenseStats(),
  ])

  return (
    <SuperExpensesContentClient
      expenses={expensesData.items}
      total={expensesData.total}
      page={expensesData.page}
      limit={expensesData.limit}
      stats={statsData}
      selectedOrgId={orgId}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  )
}

export { SuperExpensesContentSkeleton }
