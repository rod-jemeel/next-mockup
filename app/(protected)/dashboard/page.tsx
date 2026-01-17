import { Suspense } from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { MonthPicker } from "./_components/month-picker"
import { DashboardClient } from "./_components/dashboard-client"
import { getDashboard, getDashboardHistorical } from "@/lib/server/services/dashboard"
import { supabase } from "@/lib/server/db"
import { Skeleton } from "@/components/ui/skeleton"

async function DashboardContent({
  orgId,
  month,
}: {
  orgId: string
  month: string
}) {
  // Fetch all data in parallel
  const [dashboardData, historicalData, itemsResult] = await Promise.all([
    getDashboard({ month, compare: "prev", orgId }),
    getDashboardHistorical({ orgId }),
    supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true),
  ])

  const inventoryItemCount = itemsResult.count ?? 0

  return (
    <DashboardClient
      orgId={orgId}
      dashboardData={dashboardData}
      historicalData={historicalData}
      inventoryItemCount={inventoryItemCount}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  if (!session.session.activeOrganizationId) {
    redirect("/org/select")
  }

  const { month } = await searchParams
  const currentMonth = month || new Date().toISOString().slice(0, 7)
  const orgId = session.session.activeOrganizationId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Overview of your expenses and inventory
          </p>
        </div>
        <MonthPicker currentMonth={currentMonth} />
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent orgId={orgId} month={currentMonth} />
      </Suspense>
    </div>
  )
}
