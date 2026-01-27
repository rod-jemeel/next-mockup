import { listAllItems, getAllInventoryStats } from "@/lib/server/services/inventory"
import { SuperInventoryContentClient, SuperInventoryContentSkeleton } from "./super-inventory-content-client"

interface SuperInventoryContentProps {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    active?: string
    sort?: string
    order?: "asc" | "desc"
  }>
}

export async function SuperInventoryContent({ searchParams }: SuperInventoryContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const isActive = params.active === "true" ? true : params.active === "false" ? false : undefined
  const search = params.search
  const sortBy = params.sort || "name"
  const sortOrder = params.order || "asc"

  const [itemsData, statsData] = await Promise.all([
    listAllItems({
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
    getAllInventoryStats(),
  ])

  return (
    <SuperInventoryContentClient
      items={itemsData.items}
      total={itemsData.total}
      page={itemsData.page}
      limit={itemsData.limit}
      stats={statsData}
      selectedOrgId={orgId}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      activeFilter={params.active}
    />
  )
}

export { SuperInventoryContentSkeleton }
