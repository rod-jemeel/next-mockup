"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ListPaginationProps {
  total: number
  pageSize: number
  currentPage: number
  basePath?: string
}

export function ListPagination({
  total,
  pageSize,
  currentPage,
  basePath,
}: ListPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  const createUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete("page")
    } else {
      params.set("page", page.toString())
    }
    const query = params.toString()
    return basePath ? `${basePath}${query ? `?${query}` : ""}` : `?${query}`
  }

  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages} ({total} items)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          onClick={() => router.push(createUrl(currentPage - 1))}
          className="gap-1"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => router.push(createUrl(currentPage + 1))}
          className="gap-1"
        >
          Next
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
