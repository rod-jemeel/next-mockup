import { listAllRecurringTemplates, getAllRecurringStats } from "@/lib/server/services/recurring-templates"
import { SuperRecurringContentClient, SuperRecurringContentSkeleton } from "./super-recurring-content-client"

interface SuperRecurringContentProps {
  searchParams: Promise<{
    org?: string
    page?: string
    active?: string
    search?: string
    sort?: string
    order?: "asc" | "desc"
  }>
}

export async function SuperRecurringContent({ searchParams }: SuperRecurringContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const isActive = params.active === "true" ? true : params.active === "false" ? false : undefined
  const search = params.search
  const sortBy = params.sort || "vendor"
  const sortOrder = params.order || "asc"

  const [templatesData, statsData] = await Promise.all([
    listAllRecurringTemplates({
      query: {
        page,
        limit: 20,
        orgId,
        isActive,
        search,
        sortBy,
        sortOrder,
      },
    }),
    getAllRecurringStats(),
  ])

  return (
    <SuperRecurringContentClient
      templates={templatesData.items}
      total={templatesData.total}
      page={templatesData.page}
      limit={templatesData.limit}
      stats={statsData}
      selectedOrgId={orgId}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      activeFilter={params.active}
    />
  )
}

export { SuperRecurringContentSkeleton }
