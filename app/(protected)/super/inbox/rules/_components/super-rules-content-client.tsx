"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, Bell, Mail, Check, X } from "lucide-react"
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
import { EditForwardingRuleDialog } from "./edit-forwarding-rule-dialog"
import { DeleteForwardingRuleDialog } from "./delete-forwarding-rule-dialog"
import type { ForwardingRuleWithOrg } from "@/lib/server/services/forwarding-rules"

interface RulesStats {
  totalCount: number
  activeCount: number
  byOrg: Array<{ orgId: string; orgName: string; active: number; total: number }>
}

interface SuperRulesContentClientProps {
  rules: ForwardingRuleWithOrg[]
  total: number
  page: number
  limit: number
  stats: RulesStats
  selectedOrgId?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  activeFilter?: string
}

export function SuperRulesContentClient({
  rules,
  total,
  page,
  limit,
  stats,
  selectedOrgId,
  search = "",
  sortBy = "name",
  sortOrder = "asc",
  activeFilter,
}: SuperRulesContentClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [editingRule, setEditingRule] = useState<ForwardingRuleWithOrg | null>(null)
  const [deletingRule, setDeletingRule] = useState<ForwardingRuleWithOrg | null>(null)

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
    router.push(`/super/inbox/rules?${params.toString()}`)
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
          <p className="text-xs text-muted-foreground">Total Rules</p>
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
            placeholder="Search rules..."
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

      {/* Rules Table */}
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No forwarding rules found</p>
              <p className="text-xs text-muted-foreground">
                Organizations can create rules in their settings
              </p>
            </div>
          ) : (
            <Table containerClassName="h-full">
              <TableHeader className="sticky top-0 bg-card z-10 border-b-2 border-primary/20">
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-foreground"
                    >
                      Name
                      <SortIcon column="name" />
                    </button>
                  </TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-24 text-center">Notifications</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className={!rule.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <span className="text-xs font-medium">{rule.name}</span>
                        {rule.description && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.organization ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Building2 className="size-2.5" />
                          {rule.organization.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rule.email_categories ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{
                            backgroundColor: rule.email_categories.color + "20",
                          }}
                        >
                          {rule.email_categories.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground" title="In-app notifications">
                          <Bell className="size-3" />
                          {rule.notify_in_app ? (
                            <Check className="size-3 text-green-600" />
                          ) : (
                            <X className="size-3 text-red-600" />
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Email forwarding">
                          <Mail className="size-3" />
                          {rule.forward_email ? (
                            <Check className="size-3 text-green-600" />
                          ) : (
                            <X className="size-3 text-red-600" />
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rule.is_active ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-7 p-0" />}>
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingRule(rule)}
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
              basePath="/super/inbox/rules"
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditForwardingRuleDialog
        rule={editingRule}
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
      />

      {/* Delete Dialog */}
      <DeleteForwardingRuleDialog
        rule={deletingRule}
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(null)}
      />
    </div>
  )
}

export function SuperRulesContentSkeleton() {
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
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-24">Notifications</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
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
