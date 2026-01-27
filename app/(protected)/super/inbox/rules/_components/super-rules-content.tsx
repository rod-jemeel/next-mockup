import { listAllForwardingRules, getAllRulesStats } from "@/lib/server/services/forwarding-rules"
import { SuperRulesContentClient, SuperRulesContentSkeleton } from "./super-rules-content-client"

interface SuperRulesContentProps {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    sort?: string
    order?: "asc" | "desc"
    active?: string
  }>
}

export async function SuperRulesContent({ searchParams }: SuperRulesContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const search = params.search
  const sortBy = params.sort || "name"
  const sortOrder = params.order || "asc"
  const activeFilter = params.active

  const [rulesData, statsData] = await Promise.all([
    listAllForwardingRules({
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
    getAllRulesStats(),
  ])

  return (
    <SuperRulesContentClient
      rules={rulesData.items}
      total={rulesData.total}
      page={rulesData.page}
      limit={rulesData.limit}
      stats={statsData}
      selectedOrgId={orgId}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      activeFilter={activeFilter}
    />
  )
}

export { SuperRulesContentSkeleton }
