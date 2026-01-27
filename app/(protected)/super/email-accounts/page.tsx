import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperEmailAccountsContent, SuperEmailAccountsContentSkeleton } from "./_components/super-email-accounts-content"

export default function SuperEmailAccountsPage({
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
            <Link href="/super">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">Email Accounts</h1>
              <p className="text-xs text-muted-foreground">
                Manage connected email accounts across all organizations
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<SuperEmailAccountsContentSkeleton />}>
        <SuperEmailAccountsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
