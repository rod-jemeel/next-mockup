import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { OrgDetailContent } from "./_components/org-detail-content"

function OrgDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="rounded-lg border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="rounded-lg border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/super/organizations">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Organization Details</h1>
          <p className="text-xs text-muted-foreground">
            Manage organization settings, members, and configuration
          </p>
        </div>
      </div>

      <Suspense fallback={<OrgDetailSkeleton />}>
        <OrgDetailContent orgId={orgId} />
      </Suspense>
    </div>
  )
}
