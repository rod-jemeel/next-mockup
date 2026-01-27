import { listAllEmailIntegrations, getAllIntegrationStats } from "@/lib/server/services/email-integrations"
import { SuperEmailAccountsContentClient, SuperEmailAccountsContentSkeleton } from "./super-email-accounts-content-client"

interface SuperEmailAccountsContentProps {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    active?: string
    sort?: string
    order?: "asc" | "desc"
  }>
}

export async function SuperEmailAccountsContent({ searchParams }: SuperEmailAccountsContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const isActive = params.active === "true" ? true : params.active === "false" ? false : undefined
  const search = params.search
  const sortBy = params.sort || "email_address"
  const sortOrder = params.order || "asc"

  const [integrationsData, statsData] = await Promise.all([
    listAllEmailIntegrations({
      query: {
        page,
        limit: 20,
        orgId,
        includeInactive: true,
        isActive,
        search,
        sortBy,
        sortOrder,
      },
    }),
    getAllIntegrationStats(),
  ])

  return (
    <SuperEmailAccountsContentClient
      integrations={integrationsData.items}
      total={integrationsData.total}
      page={integrationsData.page}
      limit={integrationsData.limit}
      stats={statsData}
      selectedOrgId={orgId}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      activeFilter={params.active}
    />
  )
}

export { SuperEmailAccountsContentSkeleton }
