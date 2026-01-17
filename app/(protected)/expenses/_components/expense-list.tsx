import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon, PencilEdit01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ListPagination } from "@/components/list-pagination"

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
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={<Link href={`/expenses/${expense.id}/edit`} />}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">
                        <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ListPagination
        total={data.total}
        pageSize={PAGE_SIZE}
        currentPage={page}
      />
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
