import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperRulesContent, SuperRulesContentSkeleton } from "./_components/super-rules-content"

export default function SuperRulesPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string
    page?: string
    search?: string
    sort?: string
    order?: "asc" | "desc"
    active?: string
  }>
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/super/inbox">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Share2 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">Cross-Org Forwarding Rules</h1>
              <p className="text-xs text-muted-foreground">
                Manage email forwarding rules across all organizations
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<SuperRulesContentSkeleton />}>
        <SuperRulesContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
