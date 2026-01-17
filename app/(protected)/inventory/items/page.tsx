import { Suspense } from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ItemList, ItemListSkeleton } from "./_components/item-list"
import { NewItemDialog } from "./_components/new-item-dialog"

export default async function InventoryItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
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

  const params = await searchParams
  const orgId = session.session.activeOrganizationId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Inventory Items</h1>
          <p className="text-xs text-muted-foreground">
            Manage your inventory and track price history
          </p>
        </div>
        <NewItemDialog orgId={orgId} />
      </div>

      <Suspense fallback={<ItemListSkeleton />}>
        <ItemList orgId={orgId} search={params.search} />
      </Suspense>
    </div>
  )
}
