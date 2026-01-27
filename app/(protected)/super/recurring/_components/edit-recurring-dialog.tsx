"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import type { RecurringTemplateWithOrg } from "@/lib/server/services/recurring-templates"

interface Category {
  id: string
  name: string
}

interface EditRecurringDialogProps {
  template: RecurringTemplateWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
]

export function EditRecurringDialog({ template, open, onOpenChange }: EditRecurringDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    categoryId: "",
    vendor: "",
    name: "",
    estimatedAmount: "",
    typicalDayOfMonth: "",
    frequency: "monthly",
    notes: "",
    isActive: true,
  })

  // Load template data when it changes
  useEffect(() => {
    if (template) {
      setFormData({
        categoryId: template.category_id || "",
        vendor: template.vendor || "",
        name: template.name || "",
        estimatedAmount: template.estimated_amount?.toString() || "",
        typicalDayOfMonth: template.typical_day_of_month?.toString() || "",
        frequency: template.frequency || "monthly",
        notes: template.notes || "",
        isActive: template.is_active,
      })
      setError(null)
    }
  }, [template])

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open && template?.org_id) {
      fetch(`/api/orgs/${template.org_id}/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.items) {
            setCategories(data.data.items)
          }
        })
        .catch(console.error)
    }
  }, [open, template?.org_id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!template) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/recurring/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: template.org_id,
          categoryId: formData.categoryId || undefined,
          vendor: formData.vendor || undefined,
          name: formData.name || undefined,
          estimatedAmount: formData.estimatedAmount
            ? parseFloat(formData.estimatedAmount)
            : undefined,
          typicalDayOfMonth: formData.typicalDayOfMonth
            ? parseInt(formData.typicalDayOfMonth, 10)
            : undefined,
          frequency: formData.frequency,
          notes: formData.notes || undefined,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update template")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Recurring Template</DialogTitle>
          <DialogDescription>
            Update this recurring expense template
            {template?.organization && (
              <span className="block mt-1 text-foreground">
                Organization: {template.organization.name}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
                <Input
                  id="vendor"
                  placeholder="e.g., Electric Company"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Name (optional)</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Monthly Electric Bill"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="categoryId">Category</FieldLabel>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  if (value) {
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category">
                    {categories.find((c) => c.id === formData.categoryId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="frequency">Frequency</FieldLabel>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => {
                    if (value) {
                      setFormData((prev) => ({ ...prev, frequency: value }))
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="estimatedAmount">Est. Amount</FieldLabel>
                <Input
                  id="estimatedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.estimatedAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimatedAmount: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="typicalDayOfMonth">Day</FieldLabel>
                <Input
                  id="typicalDayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  value={formData.typicalDayOfMonth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      typicalDayOfMonth: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Account number, payment details, etc."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <FieldDescription>
                    Inactive templates won't generate new expenses
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
