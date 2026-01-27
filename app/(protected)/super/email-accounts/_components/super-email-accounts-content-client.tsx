"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react"
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
import { EditEmailAccountDialog } from "./edit-email-account-dialog"
import { DeleteEmailAccountDialog } from "./delete-email-account-dialog"
import type { EmailIntegrationWithOrg } from "@/lib/server/services/email-integrations"

interface IntegrationStats {
  totalCount: number
  activeCount: number
  byOrg: Array<{ orgId: string; orgName: string; active: number; total: number }>
}

interface SuperEmailAccountsContentClientProps {
  integrations: EmailIntegrationWithOrg[]
  total: number
  page: number
  limit: number
  stats: IntegrationStats
  selectedOrgId?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  activeFilter?: string
}

export function SuperEmailAccountsContentClient({
  integrations,
  total,
  page,
  limit,
  stats,
  selectedOrgId,
  search = "",
  sortBy = "email_address",
  sortOrder = "asc",
  activeFilter,
}: SuperEmailAccountsContentClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [editingAccount, setEditingAccount] = useState<EmailIntegrationWithOrg | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<EmailIntegrationWithOrg | null>(null)

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
    router.push(`/super/email-accounts?${params.toString()}`)
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

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function getProviderLabel(provider: string) {
    const labels: Record<string, string> = {
      gmail: "Gmail",
      outlook: "Outlook",
      other: "Other",
    }
    return labels[provider] || provider
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
          <p className="text-xs text-muted-foreground">Total Accounts</p>
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
            placeholder="Search email..."
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

      {/* Accounts Table */}
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
          {integrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No email accounts found</p>
              <p className="text-xs text-muted-foreground">
                Accounts will appear here when organizations connect them
              </p>
            </div>
          ) : (
            <Table containerClassName="h-full">
              <TableHeader className="sticky top-0 bg-card z-10 border-b-2 border-primary/20">
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email_address")}
                      className="flex items-center hover:text-foreground"
                    >
                      Email Address
                      <SortIcon column="email_address" />
                    </button>
                  </TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id} className={!integration.is_active ? "opacity-50" : ""}>
                    <TableCell className="text-xs font-medium">
                      {integration.email_address}
                    </TableCell>
                    <TableCell>
                      {integration.organization ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Building2 className="size-2.5" />
                          {integration.organization.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {getProviderLabel(integration.provider)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {formatDate(integration.last_sync_at)}
                        {integration.sync_error && (
                          <span className="text-destructive" title={integration.sync_error}>
                            (Error)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={integration.is_active ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {integration.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-7 p-0" />}>
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingAccount(integration)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingAccount(integration)}
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
              basePath="/super/email-accounts"
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditEmailAccountDialog
        account={editingAccount}
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
      />

      {/* Delete Dialog */}
      <DeleteEmailAccountDialog
        account={deletingAccount}
        open={!!deletingAccount}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
      />
    </div>
  )
}

export function SuperEmailAccountsContentSkeleton() {
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
              <TableHead>Email Address</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
