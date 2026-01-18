import { Suspense } from "react"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { headers } from "next/headers"
import { UserPlus } from "lucide-react"
import { auth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { MembersList } from "./_components/members-list"
import { InvitationsList } from "./_components/invitations-list"

// Dynamic import for dialog - reduces initial bundle (bundle-dynamic-imports pattern)
const InviteMemberDialog = dynamic(() =>
  import("./_components/invite-member-dialog").then((mod) => mod.InviteMemberDialog)
)

function MembersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pending invitations skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="rounded-lg border border-border">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="size-6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members list skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="rounded-lg border border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="size-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function PageWithAuth() {
  // Mark as dynamic - auth requires request headers
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  const orgId = session.session.activeOrganizationId
  if (!orgId) {
    redirect("/org/select")
  }

  // Get organization with members
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  })

  if (!org) {
    redirect("/org/select")
  }

  // Check if user is org_admin
  const currentMember = org.members.find(
    (m: { userId: string }) => m.userId === session.user.id
  )
  const isAdmin = currentMember && currentMember.role === "org_admin"

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Fetch pending invitations
  let invitations: Array<{
    id: string
    email: string
    role: string
    status: string
    expiresAt: Date
    createdAt: Date
  }> = []
  try {
    const result = await auth.api.listInvitations({
      headers: await headers(),
      query: { organizationId: orgId },
    })
    invitations = (result || []).filter(
      (inv: { status: string }) => inv.status === "pending"
    )
  } catch (error) {
    console.error("Failed to fetch invitations:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <UserPlus className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-medium">Team Members</h1>
            <p className="text-xs text-muted-foreground">
              Manage your organization&apos;s team members and invitations
            </p>
          </div>
        </div>
        <InviteMemberDialog orgId={orgId} />
      </div>

      {/* Pending invitations */}
      <InvitationsList invitations={invitations} orgId={orgId} />

      {/* Members list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
        <MembersList
          members={org.members}
          orgId={orgId}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}

export default function MembersPage() {
  return (
    <Suspense fallback={<MembersPageSkeleton />}>
      <PageWithAuth />
    </Suspense>
  )
}
