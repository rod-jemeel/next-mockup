"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { DepartmentSelect, DepartmentMemberSelect } from "./department-select"
import type { EmailCategory } from "@/lib/server/services/email-categories"
import type { DepartmentWithMembers } from "@/lib/server/services/departments"

const availableRoles = [
  { value: "org_admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "inventory", label: "Inventory" },
  { value: "viewer", label: "Viewer" },
]

interface NewRuleDialogProps {
  categories: EmailCategory[]
  departments: DepartmentWithMembers[]
}

export function NewRuleDialog({ categories, departments }: NewRuleDialogProps) {
  const router = useRouter()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [notifyRoles, setNotifyRoles] = useState<string[]>([])
  const [notifyDepartmentIds, setNotifyDepartmentIds] = useState<string[]>([])
  const [notifyDepartmentMemberIds, setNotifyDepartmentMemberIds] = useState<string[]>([])
  const [notifyInApp, setNotifyInApp] = useState(true)
  const [forwardEmail, setForwardEmail] = useState(false)

  const orgId = activeOrg?.id

  function toggleRole(role: string) {
    if (notifyRoles.includes(role)) {
      setNotifyRoles(notifyRoles.filter((r) => r !== role))
    } else {
      setNotifyRoles([...notifyRoles, role])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/orgs/${orgId}/email/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          categoryId,
          notifyRoles: notifyRoles.length > 0 ? notifyRoles : undefined,
          notifyDepartmentIds: notifyDepartmentIds.length > 0 ? notifyDepartmentIds : undefined,
          notifyDepartmentMemberIds: notifyDepartmentMemberIds.length > 0 ? notifyDepartmentMemberIds : undefined,
          notifyInApp,
          forwardEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create rule")
      }

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setName("")
    setDescription("")
    setCategoryId("")
    setNotifyRoles([])
    setNotifyDepartmentIds([])
    setNotifyDepartmentMemberIds([])
    setNotifyInApp(true)
    setForwardEmail(false)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="size-3.5" />
          New Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Forwarding Rule</DialogTitle>
          <DialogDescription>
            Create a rule to automatically notify team members about important emails
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                {error}
              </FieldError>
            )}

            <Field>
              <FieldLabel htmlFor="rule-name">Rule Name</FieldLabel>
              <Input
                id="rule-name"
                placeholder="e.g., Invoice Alerts"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="rule-description">Description</FieldLabel>
              <Textarea
                id="rule-description"
                placeholder="Optional description of what this rule does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel>Trigger Category</FieldLabel>
              <FieldDescription>
                When an email matches this category, the rule will be triggered
              </FieldDescription>
              <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category">
                    {categoryId
                      ? categories.find((c) => c.id === categoryId)?.name || "Select a category"
                      : "Select a category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Notify Roles</FieldLabel>
              <FieldDescription>
                Members with these roles will be notified
              </FieldDescription>
              <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Select roles to notify">
                {availableRoles.map((role) => (
                  <Badge
                    key={role.value}
                    role="checkbox"
                    aria-checked={notifyRoles.includes(role.value)}
                    tabIndex={0}
                    variant={notifyRoles.includes(role.value) ? "default" : "outline"}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => toggleRole(role.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleRole(role.value)
                      }
                    }}
                  >
                    {role.label}
                  </Badge>
                ))}
              </div>
            </Field>

            {departments.length > 0 && (
              <>
                <Field>
                  <FieldLabel>Notify Departments</FieldLabel>
                  <FieldDescription>
                    All members of selected departments will be notified
                  </FieldDescription>
                  <div className="mt-2">
                    <DepartmentSelect
                      departments={departments}
                      selectedIds={notifyDepartmentIds}
                      onChange={setNotifyDepartmentIds}
                      disabled={isLoading}
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Notify Specific Members</FieldLabel>
                  <FieldDescription>
                    Select individual members from departments
                  </FieldDescription>
                  <div className="mt-2">
                    <DepartmentMemberSelect
                      departments={departments}
                      selectedMemberIds={notifyDepartmentMemberIds}
                      onChange={setNotifyDepartmentMemberIds}
                      disabled={isLoading}
                    />
                  </div>
                </Field>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Field orientation="horizontal">
                <div className="flex items-center justify-between">
                  <div>
                    <FieldLabel>In-App Notification</FieldLabel>
                    <FieldDescription className="text-[10px]">
                      Show notification in the app
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={notifyInApp}
                    onCheckedChange={setNotifyInApp}
                    disabled={isLoading}
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <div className="flex items-center justify-between">
                  <div>
                    <FieldLabel>Forward Email</FieldLabel>
                    <FieldDescription className="text-[10px]">
                      Send email notification
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={forwardEmail}
                    onCheckedChange={setForwardEmail}
                    disabled={isLoading}
                  />
                </div>
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim() || !categoryId}>
                {isLoading ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
