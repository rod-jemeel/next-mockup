"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { EmailIntegrationWithOrg } from "@/lib/server/services/email-integrations"

interface EditEmailAccountDialogProps {
  account: EmailIntegrationWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PROVIDERS = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "other", label: "Other" },
]

export function EditEmailAccountDialog({ account, open, onOpenChange }: EditEmailAccountDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    provider: "gmail",
    isActive: true,
  })

  // Load account data when it changes
  useEffect(() => {
    if (account) {
      setFormData({
        provider: account.provider || "gmail",
        isActive: account.is_active,
      })
      setError(null)
    }
  }, [account])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/email-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: account.org_id,
          provider: formData.provider,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update account")
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
          <DialogTitle>Edit Email Account</DialogTitle>
          <DialogDescription>
            Update this email account
            {account?.organization && (
              <span className="block mt-1 text-foreground">
                Organization: {account.organization.name}
              </span>
            )}
            {account?.email_address && (
              <span className="block mt-1 text-foreground">
                Email: {account.email_address}
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
              <FieldLabel htmlFor="provider">Provider</FieldLabel>
              <Select
                value={formData.provider}
                onValueChange={(value) => {
                  if (value) {
                    setFormData((prev) => ({ ...prev, provider: value }))
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <FieldDescription>
                    Inactive accounts won't sync emails
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
