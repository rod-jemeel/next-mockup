import { listExpenses } from "@/lib/server/services/expenses"
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
import { ListPagination } from "@/components/list-pagination"
import { ExpenseActions } from "./expense-actions"

const PAGE_SIZE = 20

interface ExpenseListProps {
  orgId: string
  from?: string
  to?: string
  categoryId?: string
  vendor?: string
  page?: number
}

export async function ExpenseList({
  orgId,
  from,
  to,
  categoryId,
  vendor,
  page = 1,
}: ExpenseListProps) {
  const data = await listExpenses({
    query: {
      from,
      to,
      categoryId,
      vendor,
      page,
      limit: PAGE_SIZE,
    },
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
    })
  }

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-sm text-muted-foreground">No expenses found</p>
        <p className="text-xs text-muted-foreground">
          Add your first expense to get started
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
        <Table containerClassName="h-full">
          <TableHeader className="sticky top-0 bg-card z-10 border-b-2 border-primary/20">
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {data.items.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-xs">
                  {formatDate(expense.expense_date)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {expense.expense_categories?.name || "Uncategorized"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {expense.vendor || "-"}
                </TableCell>
                <TableCell className="text-right text-xs font-medium">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {expense.tax_amount > 0 ? formatCurrency(expense.tax_amount) : "-"}
                </TableCell>
                <TableCell>
                  <ExpenseActions expense={expense} orgId={orgId} />
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
      </div>
      <div className="flex-shrink-0">
        <ListPagination
          total={data.total}
          pageSize={PAGE_SIZE}
          currentPage={page}
        />
      </div>
    </div>
  )
}

export function ExpenseListSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="size-5" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
