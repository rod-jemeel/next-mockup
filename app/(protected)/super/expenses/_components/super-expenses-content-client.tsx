"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ListPagination } from "@/components/list-pagination"
import { EditExpenseDialog } from "./edit-expense-dialog"
import { DeleteExpenseDialog } from "./delete-expense-dialog"
import type { ExpenseWithOrg } from "@/lib/server/services/expenses"

interface ExpenseStats {
  totalCount: number
  totalAmount: number
  byOrg: Array<{ orgId: string; orgName: string; count: number; total: number }>
}

interface SuperExpensesContentClientProps {
  expenses: ExpenseWithOrg[]
  total: number
  page: number
  limit: number
  stats: ExpenseStats
  selectedOrgId?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export function SuperExpensesContentClient({
  expenses,
  total,
  page,
  limit,
  stats,
  selectedOrgId,
  search = "",
  sortBy = "expense_date",
  sortOrder = "desc",
}: SuperExpensesContentClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithOrg | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithOrg | null>(null)

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    params.delete("page") // Reset page on filter change
    router.push(`/super/expenses?${params.toString()}`)
  }, [router, searchParams])

  function handleOrgChange(orgId: string | null) {
    if (!orgId) return
    updateParams({ org: orgId === "all" ? undefined : orgId })
  }

  function handleSort(column: string) {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc"
    updateParams({ sort: column, order: newOrder })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchValue || undefined })
  }

  function SortIcon({ column }: { column: string }) {
    if (sortBy !== column) return <ArrowUpDown className="size-3 ml-1" />
    return sortOrder === "asc"
      ? <ArrowUp className="size-3 ml-1" />
      : <ArrowDown className="size-3 ml-1" />
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-semibold">{stats.totalCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-semibold text-primary">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Organizations</p>
          <p className="text-2xl font-semibold">{stats.byOrg.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search vendor..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-[200px] h-7"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Select value={selectedOrgId || "all"} onValueChange={handleOrgChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {stats.byOrg.map((org) => (
              <SelectItem key={org.orgId} value={org.orgId}>
                {org.orgName} ({org.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expense Table */}
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No expenses found</p>
              <p className="text-xs text-muted-foreground">
                Expenses will appear here when organizations add them
              </p>
            </div>
          ) : (
            <Table containerClassName="h-full">
              <TableHeader className="sticky top-0 bg-card z-10 border-b-2 border-primary/20">
                <TableRow>
                  <TableHead className="w-28">
                    <button
                      onClick={() => handleSort("expense_date")}
                      className="flex items-center hover:text-foreground"
                    >
                      Date
                      <SortIcon column="expense_date" />
                    </button>
                  </TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("vendor")}
                      className="flex items-center hover:text-foreground"
                    >
                      Vendor
                      <SortIcon column="vendor" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center justify-end hover:text-foreground ml-auto"
                    >
                      Amount
                      <SortIcon column="amount" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs">
                      {formatDate(expense.expense_date)}
                    </TableCell>
                    <TableCell>
                      {expense.organization ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Building2 className="size-2.5" />
                          {expense.organization.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
                      {expense.tax_amount && expense.tax_amount > 0
                        ? formatCurrency(expense.tax_amount)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-7 p-0" />}>
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingExpense(expense)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingExpense(expense)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {total > limit && (
          <div className="flex-shrink-0">
            <ListPagination
              total={total}
              pageSize={limit}
              currentPage={page}
              basePath="/super/expenses"
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      />

      {/* Delete Dialog */}
      <DeleteExpenseDialog
        expense={deletingExpense}
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      />
    </div>
  )
}

export function SuperExpensesContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2">
        <div className="h-7 w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-7 w-[200px] bg-muted rounded animate-pulse" />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="w-12" />
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
                  <Skeleton className="h-5 w-20" />
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
                  <Skeleton className="h-7 w-7" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
