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
import { EditEmailCategoryDialog } from "./edit-email-category-dialog"
import { DeleteEmailCategoryDialog } from "./delete-email-category-dialog"
import type { EmailCategoryWithOrg } from "@/lib/server/services/email-categories"

interface CategoryStats {
  totalCount: number
  activeCount: number
  byOrg: Array<{ orgId: string; orgName: string; active: number; total: number }>
}

interface SuperEmailCategoriesContentClientProps {
  categories: EmailCategoryWithOrg[]
  total: number
  page: number
  limit: number
  stats: CategoryStats
  selectedOrgId?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  activeFilter?: string
}

export function SuperEmailCategoriesContentClient({
  categories,
  total,
  page,
  limit,
  stats,
  selectedOrgId,
  search = "",
  sortBy = "name",
  sortOrder = "asc",
  activeFilter,
}: SuperEmailCategoriesContentClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [editingCategory, setEditingCategory] = useState<EmailCategoryWithOrg | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<EmailCategoryWithOrg | null>(null)

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
    router.push(`/super/email-categories?${params.toString()}`)
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
          <p className="text-xs text-muted-foreground">Total Categories</p>
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
            placeholder="Search categories..."
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

      {/* Categories Table */}
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No email categories found</p>
              <p className="text-xs text-muted-foreground">
                Categories will appear here when organizations create them
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
                  <TableHead>Description</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className={!category.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.organization ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Building2 className="size-2.5" />
                          {category.organization.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {category.keywords?.slice(0, 2).map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {keyword}
                          </Badge>
                        ))}
                        {category.keywords && category.keywords.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{category.keywords.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={category.is_active ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-7 p-0" />}>
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingCategory(category)}
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
              basePath="/super/email-categories"
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditEmailCategoryDialog
        category={editingCategory}
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      />

      {/* Delete Dialog */}
      <DeleteEmailCategoryDialog
        category={deletingCategory}
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      />
    </div>
  )
}

export function SuperEmailCategoriesContentSkeleton() {
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
              <TableHead>Description</TableHead>
              <TableHead>Keywords</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
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
