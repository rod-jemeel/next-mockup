import { Suspense } from "react"
import { Inbox } from "lucide-react"
import { SuperInboxContent, SuperInboxContentSkeleton } from "./_components/super-inbox-content"

interface PageProps {
  searchParams: Promise<{
    org?: string
    category?: string
    status?: string
    page?: string
  }>
}

export default async function SuperInboxPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Inbox className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-medium">Cross-Org Inbox</h1>
            <p className="text-xs text-muted-foreground">
              Detected emails from all organizations
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<SuperInboxContentSkeleton />}>
        <SuperInboxContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
