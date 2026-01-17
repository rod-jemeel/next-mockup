import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { OrgSelector } from "./_components/org-selector"

export default async function OrgSelectPage() {
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
