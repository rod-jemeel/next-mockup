"use client"

import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface ExpenseFiltersProps {
  currentFrom?: string
  currentTo?: string
  currentCategoryId?: string
  orgId: string
}

interface Category {
  id: string
  name: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ExpenseFilters({
  currentFrom,
  currentTo,
  currentCategoryId,
  orgId,
}: ExpenseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { data } = useSWR<{ data: { items: Category[] } }>(
    `/api/orgs/${orgId}/categories`,
    fetcher
  )
  const categories = data?.data?.items ?? []

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/expenses")
  }

  const hasFilters = currentFrom || currentTo || currentCategoryId

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Filters:</span>
      </div>

      <Input
        type="date"
        placeholder="From"
        value={currentFrom || ""}
        onChange={(e) => updateFilter("from", e.target.value || undefined)}
        className="h-7 w-auto"
      />

      <Input
        type="date"
        placeholder="To"
        value={currentTo || ""}
        onChange={(e) => updateFilter("to", e.target.value || undefined)}
        className="h-7 w-auto"
      />

      <Select
        value={currentCategoryId ?? "all"}
        onValueChange={(value) => {
          if (!value || value === "all") {
            updateFilter("categoryId", undefined)
          } else {
            updateFilter("categoryId", value)
          }
        }}
      >
        <SelectTrigger className="h-7 w-40">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 gap-1"
        >
          <X className="size-3" />
          Clear
        </Button>
      )}

      {hasFilters && (
        <Badge variant="secondary" className="text-[10px]">
          Filtered
        </Badge>
      )}
    </div>
  )
}
