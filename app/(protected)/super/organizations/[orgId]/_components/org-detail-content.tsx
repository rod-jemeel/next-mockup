import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getSessionOrThrow, isSuperadmin } from "@/lib/server/auth-helpers"
import { OrgDetailClient } from "./org-detail-client"

interface OrgDetailContentProps {
  orgId: string
}

export async function OrgDetailContent({ orgId }: OrgDetailContentProps) {
  const session = await getSessionOrThrow()

  if (!isSuperadmin(session)) {
    redirect("/dashboard")
  }

  const hdrs = await headers()

  const [org, invitationsResult] = await Promise.all([
    auth.api.getFullOrganization({
      headers: hdrs,
      query: { organizationId: orgId },
    }),
    auth.api.listInvitations({
      headers: hdrs,
      query: { organizationId: orgId },
    }),
  ])

  if (!org) {
    redirect("/super/organizations")
  }

  const metadata = (org.metadata || {}) as Record<string, unknown>
  const members = org.members || []
  const invitations = (invitationsResult || []).filter(
    (inv: { status: string }) => inv.status === "pending"
  )

  return (
    <OrgDetailClient
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: String(org.createdAt),
        defaultTaxRate: (metadata.defaultTaxRate as number) ?? 0,
      }}
      initialMembers={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: {
          name: (m as { user?: { name?: string } }).user?.name || "Unknown",
          email: (m as { user?: { email?: string } }).user?.email || "",
        },
      }))}
      initialInvitations={invitations.map(
        (inv: { id: string; email: string; role: string; status: string }) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
        })
      )}
    />
  )
}
