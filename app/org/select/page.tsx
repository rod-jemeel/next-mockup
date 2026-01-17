import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { OrgSelector } from "./_components/org-selector"
import { Skeleton } from "@/components/ui/skeleton"

function OrgSelectSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

async function OrgSelectContent() {
  // Mark as dynamic - auth requires request headers
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  // Get user's organizations
  const orgs = await auth.api.listOrganizations({
    headers: await headers(),
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-medium">Select Organization</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an organization to continue
          </p>
        </div>
        <OrgSelector organizations={orgs || []} />
      </div>
    </div>
  )
}

export default function OrgSelectPage() {
  return (
    <Suspense fallback={<OrgSelectSkeleton />}>
      <OrgSelectContent />
    </Suspense>
  )
}
