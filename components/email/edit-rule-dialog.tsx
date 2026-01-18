"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import type { EmailCategory } from "@/lib/server/services/email-categories"
import type { ForwardingRuleWithCategory } from "@/lib/server/services/forwarding-rules"

const availableRoles = [
  { value: "org_admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "inventory", label: "Inventory" },
  { value: "viewer", label: "Viewer" },
]

interface EditRuleDialogProps {
  rule: ForwardingRuleWithCategory | null
  categories: EmailCategory[]
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRuleDialog({
  rule,
  categories,
  orgId,
  open,
  onOpenChange,
}: EditRuleDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [notifyRoles, setNotifyRoles] = useState<string[]>([])
  const [notifyInApp, setNotifyInApp] = useState(true)
  const [forwardEmail, setForwardEmail] = useState(false)

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setDescription(rule.description || "")
      setCategoryId(rule.category_id)
      setNotifyRoles(rule.notify_roles)
      setNotifyInApp(rule.notify_in_app)
      setForwardEmail(rule.forward_email)
      setError(null)
    }
  }, [rule])

  function toggleRole(role: string) {
    if (notifyRoles.includes(role)) {
      setNotifyRoles(notifyRoles.filter((r) => r !== role))
    } else {
      setNotifyRoles([...notifyRoles, role])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rule) return

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/orgs/${orgId}/email/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          categoryId,
          notifyRoles,
          notifyInApp,
          forwardEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update rule")
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!rule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Forwarding Rule</DialogTitle>
          <DialogDescription>
            Update the rule settings and notification preferences
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
              <FieldLabel htmlFor="edit-rule-name">Rule Name</FieldLabel>
              <Input
                id="edit-rule-name"
                placeholder="e.g., Invoice Alerts"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-rule-description">Description</FieldLabel>
              <Textarea
                id="edit-rule-description"
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
                    {categories.find((c) => c.id === categoryId)?.name || "Select a category"}
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
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim() || !categoryId}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
