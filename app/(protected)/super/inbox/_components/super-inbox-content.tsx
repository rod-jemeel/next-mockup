import { listAllDetectedEmails, getAllEmailCounts } from "@/lib/server/services/detected-emails"
import { SuperInboxContentClient, SuperInboxContentSkeleton } from "./super-inbox-content-client"

interface SuperInboxContentProps {
  searchParams: Promise<{
    org?: string
    category?: string
    status?: string
    page?: string
  }>
}

export async function SuperInboxContent({ searchParams }: SuperInboxContentProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const orgId = params.org
  const isRead = params.status === "read" ? true : params.status === "unread" ? false : undefined

  const [emailsData, countsData] = await Promise.all([
    listAllDetectedEmails({
      query: {
        page,
        limit: 20,
        orgId,
        isRead,
        isArchived: false,
      },
    }),
    getAllEmailCounts(),
  ])

  return (
    <SuperInboxContentClient
      emails={emailsData.items}
      total={emailsData.total}
      page={emailsData.page}
      limit={emailsData.limit}
      counts={countsData}
      selectedOrgId={orgId}
    />
  )
}

export { SuperInboxContentSkeleton }
