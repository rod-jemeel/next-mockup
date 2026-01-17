"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Building03Icon, PlusSignIcon, Tick01Icon } from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
}

interface OrgSelectorProps {
  organizations: Organization[]
}

export function OrgSelector({ organizations }: OrgSelectorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: activeOrg } = authClient.useActiveOrganization()

  const handleSelectOrg = async (orgId: string) => {
    setIsLoading(orgId)
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to select organization:", error)
      setIsLoading(null)
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setIsCreating(true)
    try {
      const result = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgName.trim().toLowerCase().replace(/\s+/g, "-"),
      })

      if (result.data) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        })
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
    } finally {
      setIsCreating(false)
      setDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      {organizations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">No organizations</CardTitle>
            <CardDescription>
              Create your first organization to get started
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleSelectOrg(org.id)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">/{org.slug}</p>
                </div>
                {activeOrg?.id === org.id && (
                  <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="size-4 text-primary" />
                )}
                {isLoading === org.id && (
                  <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
            Create Organization
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage your expenses and inventory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrg}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-name">Organization Name</FieldLabel>
                <Input
                  id="org-name"
                  placeholder="My Company"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  disabled={isCreating}
                  required
                />
              </Field>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
