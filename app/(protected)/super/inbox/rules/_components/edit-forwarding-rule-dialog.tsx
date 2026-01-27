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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type { ForwardingRuleWithOrg } from "@/lib/server/services/forwarding-rules"

interface EditForwardingRuleDialogProps {
  rule: ForwardingRuleWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditForwardingRuleDialog({ rule, open, onOpenChange }: EditForwardingRuleDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    notifyInApp: true,
    forwardEmail: false,
    isActive: true,
  })

  // Load rule data when it changes
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || "",
        description: rule.description || "",
        notifyInApp: rule.notify_in_app,
        forwardEmail: rule.forward_email,
        isActive: rule.is_active,
      })
      setError(null)
    }
  }, [rule])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rule) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/forwarding-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: rule.org_id,
          name: formData.name,
          description: formData.description || undefined,
          notifyInApp: formData.notifyInApp,
          forwardEmail: formData.forwardEmail,
          isActive: formData.isActive,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Forwarding Rule</DialogTitle>
          <DialogDescription>
            Update this forwarding rule
            {rule?.organization && (
              <span className="block mt-1 text-foreground">
                Organization: {rule.organization.name}
              </span>
            )}
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
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                placeholder="Rule name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
              <Textarea
                id="description"
                placeholder="Describe what this rule does"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="notifyInApp">In-App Notifications</FieldLabel>
                  <FieldDescription>
                    Show notifications in the app
                  </FieldDescription>
                </div>
                <Switch
                  id="notifyInApp"
                  checked={formData.notifyInApp}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, notifyInApp: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="forwardEmail">Email Forwarding</FieldLabel>
                  <FieldDescription>
                    Forward matching emails
                  </FieldDescription>
                </div>
                <Switch
                  id="forwardEmail"
                  checked={formData.forwardEmail}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, forwardEmail: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <FieldDescription>
                    Inactive rules won't process new emails
                  </FieldDescription>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
