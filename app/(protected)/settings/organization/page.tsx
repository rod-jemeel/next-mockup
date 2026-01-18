import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { headers } from "next/headers"
import { Building2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { OrganizationSettingsForm } from "./_components/organization-settings-form"

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// Server component that fetches settings
async function SettingsContent() {
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

  // Fetch organization details
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  })

  if (!org) {
    redirect("/org/select")
  }

  // Parse metadata for defaultTaxRate
  const metadata = org.metadata as Record<string, unknown> | undefined
  const defaultTaxRate =
    metadata && typeof metadata.defaultTaxRate === "number"
      ? metadata.defaultTaxRate
      : 0

  const settings = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    defaultTaxRate,
  }

  return (
    <div className="space-y-6">
      {/* Static header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-medium">Organization Settings</h1>
          <p className="text-xs text-muted-foreground">
            Configure settings for your organization
          </p>
        </div>
      </div>

      {/* Client form with initial data */}
      <OrganizationSettingsForm initialSettings={settings} orgId={orgId} />
    </div>
  )
}

// Page with Suspense boundary for streaming
export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
