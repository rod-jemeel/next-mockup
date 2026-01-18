"use client"

import { ChartContainer } from "@/components/charts/chart-container"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Expense {
  id: string
  date: string
  vendor: string | null
  categoryName: string
  amount: number
  taxAmount: number
}

interface RecentExpensesTableProps {
  data: Expense[]
  maxHeight?: number
}

export function RecentExpensesTable({
  data,
  maxHeight = 300,
}: RecentExpensesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  if (!data || data.length === 0) {
    return (
      <ChartContainer
        title="Recent Expenses"
        description="Latest expense entries"
      >
        <div
          className="flex items-center justify-center text-muted-foreground text-sm"
          style={{ height: maxHeight }}
        >
          No expenses recorded
        </div>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer
      title="Recent Expenses"
      description="Latest expense entries"
    >
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10 border-b-2 border-primary/20">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell>{expense.vendor || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{expense.categoryName}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {expense.taxAmount > 0 ? formatCurrency(expense.taxAmount) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartContainer>
  )
}
