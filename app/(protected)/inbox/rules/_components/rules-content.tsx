import { listForwardingRules } from "@/lib/server/services/forwarding-rules"
import { listEmailCategories } from "@/lib/server/services/email-categories"
import { listDepartments } from "@/lib/server/services/departments"
import { RulesContentClient, RulesContentSkeleton } from "./rules-content-client"

interface RulesContentProps {
  orgId: string
}

export async function RulesContent({ orgId }: RulesContentProps) {
  const [rulesData, categoriesData, departmentsData] = await Promise.all([
    listForwardingRules({
      orgId,
      query: { includeInactive: true },
    }),
    listEmailCategories({
      orgId,
      query: { includeInactive: false },
    }),
    listDepartments({
      orgId,
      query: { includeInactive: false },
    }),
  ])

  return (
    <RulesContentClient
      rules={rulesData.items}
      categories={categoriesData.items}
      departments={departmentsData.items}
      orgId={orgId}
    />
  )
}

export { RulesContentSkeleton }
