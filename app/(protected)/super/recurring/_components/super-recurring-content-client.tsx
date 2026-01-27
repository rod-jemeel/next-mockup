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
import { EditRecurringDialog } from "./edit-recurring-dialog"
import { DeleteRecurringDialog } from "./delete-recurring-dialog"
import type { RecurringTemplateWithOrg } from "@/lib/server/services/recurring-templates"

interface RecurringStats {
  totalCount: number
  activeCount: number
  byOrg: Array<{ orgId: string; orgName: string; active: number; total: number }>
}

interface SuperRecurringContentClientProps {
  templates: RecurringTemplateWithOrg[]
  total: number
  page: number
  limit: number
  stats: RecurringStats
  selectedOrgId?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  activeFilter?: string
}

export function SuperRecurringContentClient({
  templates,
  total,
  page,
  limit,
  stats,
  selectedOrgId,
  search = "",
  sortBy = "vendor",
  sortOrder = "asc",
  activeFilter,
}: SuperRecurringContentClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplateWithOrg | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<RecurringTemplateWithOrg | null>(null)

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
    router.push(`/super/recurring?${params.toString()}`)
  }, [router, searchParams])

  function handleOrgChange(orgId: string | null) {
    if (!orgId) return
    updateParams({ org: orgId === "all" ? undefined : orgId })
  }

  function handleActiveChange(value: string | null) {
    if (!value) return
    updateParams({ active: value === "all" ? undefined : value })
  }

  function handleSort(column: string) {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc"
    updateParams({ sort: column, order: newOrder })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchValue || undefined })
  }

  function formatCurrency(amount: number | null) {
    if (amount === null) return "—"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  function formatFrequency(freq: string) {
    const labels: Record<string, string> = {
      monthly: "Monthly",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    }
    return labels[freq] || freq
  }

  function SortIcon({ column }: { column: string }) {
    if (sortBy !== column) return <ArrowUpDown className="size-3 ml-1" />
    return sortOrder === "asc"
      ? <ArrowUp className="size-3 ml-1" />
      : <ArrowDown className="size-3 ml-1" />
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Templates</p>
          <p className="text-2xl font-semibold">{stats.totalCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-semibold text-green-600">{stats.activeCount}</p>
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
            placeholder="Search vendor or name..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-[200px] h-7"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Select value={selectedOrgId || "all"} onValueChange={handleOrgChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {stats.byOrg.map((org) => (
              <SelectItem key={org.orgId} value={org.orgId}>
                {org.orgName} ({org.active}/{org.total})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={activeFilter || "all"} onValueChange={handleActiveChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Table */}
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No recurring templates found</p>
              <p className="text-xs text-muted-foreground">
                Templates will appear here when organizations create them
              </p>
            </div>
          ) : (
            <Table containerClassName="h-full">
              <TableHeader className="sticky top-0 bg-card z-10 border-b-2 border-primary/20">
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("vendor")}
                      className="flex items-center hover:text-foreground"
                    >
                      Vendor/Name
                      <SortIcon column="vendor" />
                    </button>
                  </TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("estimated_amount")}
                      className="flex items-center ml-auto hover:text-foreground"
                    >
                      Est. Amount
                      <SortIcon column="estimated_amount" />
                    </button>
                  </TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} className={!template.is_active ? "opacity-50" : ""}>
                    <TableCell className="text-xs font-medium">
                      {template.name || template.vendor || "Untitled"}
                    </TableCell>
                    <TableCell>
                      {template.organization ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Building2 className="size-2.5" />
                          {template.organization.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.expense_categories && (
                        <Badge variant="secondary" className="text-[10px]">
                          {template.expense_categories.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatFrequency(template.frequency)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {formatCurrency(template.estimated_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.is_active ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-7 p-0" />}>
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingTemplate(template)}
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
              basePath="/super/recurring"
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditRecurringDialog
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      />

      {/* Delete Dialog */}
      <DeleteRecurringDialog
        template={deletingTemplate}
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      />
    </div>
  )
}

export function SuperRecurringContentSkeleton() {
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
        <div className="h-7 w-[180px] bg-muted rounded animate-pulse" />
        <div className="h-7 w-[120px] bg-muted rounded animate-pulse" />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor/Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead className="text-right">Est. Amount</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                <TableCell><Skeleton className="h-7 w-7" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
