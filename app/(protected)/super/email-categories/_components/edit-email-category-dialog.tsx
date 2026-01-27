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
import type { EmailCategoryWithOrg } from "@/lib/server/services/email-categories"

interface EditEmailCategoryDialogProps {
  category: EmailCategoryWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditEmailCategoryDialog({ category, open, onOpenChange }: EditEmailCategoryDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    keywords: "",
    isActive: true,
  })

  // Load category data when it changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        color: category.color || "#3b82f6",
        keywords: category.keywords?.join(", ") || "",
        isActive: category.is_active,
      })
      setError(null)
    }
  }, [category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/email-categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: category.org_id,
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          keywords: formData.keywords
            ? formData.keywords.split(",").map((k) => k.trim()).filter(Boolean)
            : undefined,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update category")
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
          <DialogTitle>Edit Email Category</DialogTitle>
          <DialogDescription>
            Update this email category
            {category?.organization && (
              <span className="block mt-1 text-foreground">
                Organization: {category.organization.name}
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

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Category name"
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

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <FieldDescription>
                    Inactive categories won't match new emails
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
