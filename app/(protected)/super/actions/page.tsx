import Link from "next/link"
import { ArrowLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminExpenseDialog } from "./_components/admin-expense-dialog"
import { AdminRecurringDialog } from "./_components/admin-recurring-dialog"
import { AdminInventoryDialog } from "./_components/admin-inventory-dialog"

export default function SuperActionsPage() {
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
              <Zap className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">Quick Actions</h1>
              <p className="text-xs text-muted-foreground">
                Create items for any organization from one place
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium mb-4">Create New</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Select an organization using the dropdown, then create items. Your last selected
          organization is remembered.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminExpenseDialog />
          <AdminRecurringDialog />
          <AdminInventoryDialog />
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border p-6">
        <h2 className="text-sm font-medium mb-2">Organization Context</h2>
        <p className="text-xs text-muted-foreground">
          When you select an organization in any dialog, that selection is saved to your browser.
          The next time you open a dialog, it will default to the last organization you selected.
        </p>
      </div>
    </div>
  )
}
