import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperEmailCategoriesContent, SuperEmailCategoriesContentSkeleton } from "./_components/super-email-categories-content"
import { AdminEmailCategoryDialog } from "./_components/admin-email-category-dialog"

export default function SuperEmailCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    sort?: string
    order?: "asc" | "desc"
    active?: string
  }>
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/super">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">Email Categories</h1>
              <p className="text-xs text-muted-foreground">
                Manage email categories across all organizations
              </p>
            </div>
          </div>
        </div>
        <AdminEmailCategoryDialog />
      </div>

      <Suspense fallback={<SuperEmailCategoriesContentSkeleton />}>
        <SuperEmailCategoriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
