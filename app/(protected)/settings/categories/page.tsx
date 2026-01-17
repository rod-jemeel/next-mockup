import { Suspense } from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tag01Icon } from "@hugeicons/core-free-icons"
import { auth } from "@/lib/auth"
import { CategoryList, CategoryListSkeleton } from "./_components/category-list"
import { NewCategoryDialog } from "./_components/new-category-dialog"

export default async function CategoriesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  if (!session.session.activeOrganizationId) {
    redirect("/org/select")
  }

  const orgId = session.session.activeOrganizationId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-medium">Expense Categories</h1>
            <p className="text-xs text-muted-foreground">
              Manage categories for organizing expenses
            </p>
          </div>
        </div>
        <NewCategoryDialog orgId={orgId} />
      </div>

      <Suspense fallback={<CategoryListSkeleton />}>
        <CategoryList orgId={orgId} />
      </Suspense>
    </div>
  )
}
