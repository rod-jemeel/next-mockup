import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Users, DollarSign, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllOrganizations } from "@/lib/server/services/super-dashboard"
import { CreateOrgDialog } from "./_components/create-org-dialog"
import { InviteAdminDialog } from "./_components/invite-admin-dialog"

function OrganizationsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Monthly Expenses</TableHead>
            <TableHead>Inventory Items</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-7 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

async function OrganizationsTable() {
  const organizations = await getAllOrganizations()

  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <Building2 className="mx-auto size-10 text-muted-foreground" />
        <h3 className="mt-4 text-sm font-medium">No organizations yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first organization to get started.
        </p>
        <div className="mt-4">
          <CreateOrgDialog />
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Monthly Expenses</TableHead>
            <TableHead>Inventory Items</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.slug}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="size-3.5 text-muted-foreground" />
                  <span>{org.memberCount}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  <span>{formatCurrency(org.monthlyExpenses || 0)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs">
                  <Package className="size-3.5 text-muted-foreground" />
                  <span>{org.inventoryItemCount || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {formatDate(org.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                <InviteAdminDialog organization={{ id: org.id, name: org.name }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function SuperOrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/super">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-medium">Organization Management</h1>
            <p className="text-xs text-muted-foreground">
              Create and manage organizations across the platform
            </p>
          </div>
        </div>
        <CreateOrgDialog />
      </div>

      <Suspense fallback={<OrganizationsTableSkeleton />}>
        <OrganizationsTable />
      </Suspense>
    </div>
  )
}
