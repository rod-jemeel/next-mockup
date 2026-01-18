import { Suspense } from "react"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { headers } from "next/headers"
import { Users } from "lucide-react"
import { auth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { listDepartments } from "@/lib/server/services/departments"
import { DepartmentsList } from "./_components/departments-list"

// Dynamic import for dialog
const NewDepartmentDialog = dynamic(() =>
  import("./_components/new-department-dialog").then((mod) => mod.NewDepartmentDialog)
)

function DepartmentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="size-6" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function PageWithAuth() {
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

  // Get organization and check admin status
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  })

  if (!org) {
    redirect("/org/select")
  }

  const currentMember = org.members.find(
    (m: { userId: string }) => m.userId === session.user.id
  )
  const userRole = currentMember?.role as string
  const isAdmin = currentMember && (userRole === "org_admin" || userRole === "owner")

  // Fetch departments
  const { items: departments } = await listDepartments({
    orgId,
    query: { includeInactive: isAdmin || false },
  })

  // Get org members for adding to departments
  const orgMembers = org.members.map((m: { userId: string; role: string; user: { id: string; name: string | null; email: string } }) => ({
    userId: m.userId,
    role: m.role,
    name: m.user.name,
    email: m.user.email,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-medium">Departments</h1>
            <p className="text-xs text-muted-foreground">
              Organize your team into departments for targeted notifications
            </p>
          </div>
        </div>
        {isAdmin && <NewDepartmentDialog orgId={orgId} />}
      </div>

      <DepartmentsList
        departments={departments}
        orgId={orgId}
        orgMembers={orgMembers}
        isAdmin={isAdmin || false}
        currentUserId={session.user.id}
      />
    </div>
  )
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<DepartmentsPageSkeleton />}>
      <PageWithAuth />
    </Suspense>
  )
}
