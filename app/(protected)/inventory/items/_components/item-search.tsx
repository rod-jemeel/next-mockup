"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ItemSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const search = searchParams.get("search") ?? ""

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
      params.delete("page") // Reset to page 1 on new search
    } else {
      params.delete("search")
    }

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("page")

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search items by name or SKU..."
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-9 pl-9 pr-9"
          disabled={isPending}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2"
            disabled={isPending}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
