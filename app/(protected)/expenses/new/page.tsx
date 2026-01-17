import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { NewExpenseForm } from "./_components/new-expense-form"

export default async function NewExpensePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  if (!session.session.activeOrganizationId) {
    redirect("/org/select")
  }

  const orgId = session.session.activeOrganizationId

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/expenses">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">New Expense</h1>
          <p className="text-xs text-muted-foreground">
            Add a new expense to your organization
          </p>
        </div>
      </div>

      <NewExpenseForm orgId={orgId} />
    </div>
  )
}
