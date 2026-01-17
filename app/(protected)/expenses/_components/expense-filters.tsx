"use client"

import { useQueryState } from "nuqs"
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
  orgId: string
}

interface Category {
  id: string
  name: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ExpenseFilters({ orgId }: ExpenseFiltersProps) {
  const [from, setFrom] = useQueryState("from")
  const [to, setTo] = useQueryState("to")
  const [categoryId, setCategoryId] = useQueryState("categoryId")

  const { data } = useSWR<{ data: { items: Category[] } }>(
    `/api/orgs/${orgId}/categories`,
    fetcher
  )
  const categories = data?.data?.items ?? []

  const clearFilters = () => {
    setFrom(null)
    setTo(null)
    setCategoryId(null)
  }

  const hasFilters = from || to || categoryId

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Filters:</span>
      </div>

      <Input
        type="date"
        placeholder="From"
        value={from ?? ""}
        onChange={(e) => setFrom(e.target.value || null)}
        className="h-7 w-auto"
      />

      <Input
        type="date"
        placeholder="To"
        value={to ?? ""}
        onChange={(e) => setTo(e.target.value || null)}
        className="h-7 w-auto"
      />

      <Select
        value={categoryId ?? "all"}
        onValueChange={(value) => {
          if (!value || value === "all") {
            setCategoryId(null)
          } else {
            setCategoryId(value)
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
