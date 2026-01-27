"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { AdminOrgSelector } from "@/components/admin/admin-org-selector"
import { useAdminOrg } from "@/hooks/use-admin-org"

export function AdminEmailCategoryDialog() {
  const router = useRouter()
  const { selectedOrgId } = useAdminOrg()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    keywords: "",
  })

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      keywords: "",
    })
    setError(null)
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) {
      setError("Please select an organization")
      return
    }
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/super/email-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: selectedOrgId,
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          keywords: formData.keywords
            ? formData.keywords.split(",").map((k) => k.trim()).filter(Boolean)
            : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create category")
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Email Category (Admin)</DialogTitle>
          <DialogDescription>
            Create an email category for any organization
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
              <FieldLabel>Organization</FieldLabel>
              <AdminOrgSelector disabled={isLoading} />
              {!selectedOrgId && (
                <FieldDescription className="text-yellow-600">
                  Please select an organization first
                </FieldDescription>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Invoices"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="color">Color</FieldLabel>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  disabled={isLoading}
                  className="h-9 w-14 p-1"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
              <Textarea
                id="description"
                placeholder="Describe what emails this category captures"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="keywords">Keywords (optional)</FieldLabel>
              <Input
                id="keywords"
                placeholder="invoice, receipt, payment"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, keywords: e.target.value }))
                }
                disabled={isLoading}
              />
              <FieldDescription>
                Comma-separated keywords for auto-categorization
              </FieldDescription>
            </Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedOrgId}>
                {isLoading ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
