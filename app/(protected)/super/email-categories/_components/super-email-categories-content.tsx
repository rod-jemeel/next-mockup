import { listAllEmailCategories, getAllCategoryStats } from "@/lib/server/services/email-categories"
import { SuperEmailCategoriesContentClient, SuperEmailCategoriesContentSkeleton } from "./super-email-categories-content-client"

interface SuperEmailCategoriesContentProps {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    sort?: string
    order?: "asc" | "desc"
    active?: string
  }>
}

export async function SuperEmailCategoriesContent({ searchParams }: SuperEmailCategoriesContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const search = params.search
  const sortBy = params.sort || "name"
  const sortOrder = params.order || "asc"
  const activeFilter = params.active

  const [categoriesData, statsData] = await Promise.all([
    listAllEmailCategories({
      query: {
        page,
        limit: 20,
        orgId,
        search,
        sortBy,
        sortOrder,
        isActive: activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
        includeInactive: true,
      },
    }),
    getAllCategoryStats(),
  ])

  return (
    <SuperEmailCategoriesContentClient
      categories={categoriesData.items}
      total={categoriesData.total}
      page={categoriesData.page}
      limit={categoriesData.limit}
      stats={statsData}
      selectedOrgId={orgId}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      activeFilter={activeFilter}
    />
  )
}

export { SuperEmailCategoriesContentSkeleton }
