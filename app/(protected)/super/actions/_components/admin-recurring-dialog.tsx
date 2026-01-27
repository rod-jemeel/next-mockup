"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

interface Category {
  id: string
  name: string
}

export function AdminRecurringDialog() {
  const router = useRouter()
  const { selectedOrgId } = useAdminOrg()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    categoryId: "",
    vendor: "",
    estimatedAmount: "",
    typicalDayOfMonth: "",
    notes: "",
  })

  // Fetch categories when dialog opens or org changes
  useEffect(() => {
    if (open && selectedOrgId) {
      fetch(`/api/orgs/${selectedOrgId}/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.items) {
            setCategories(data.data.items)
          }
        })
        .catch(console.error)
    }
  }, [open, selectedOrgId])

  function resetForm() {
    setFormData({
      categoryId: "",
      vendor: "",
      estimatedAmount: "",
      typicalDayOfMonth: "",
      notes: "",
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
      const response = await fetch("/api/super/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: selectedOrgId,
          categoryId: formData.categoryId,
          vendor: formData.vendor || undefined,
          estimatedAmount: formData.estimatedAmount
            ? parseFloat(formData.estimatedAmount)
            : undefined,
          typicalDayOfMonth: formData.typicalDayOfMonth
            ? parseInt(formData.typicalDayOfMonth, 10)
            : undefined,
          notes: formData.notes || undefined,
          frequency: "monthly",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create template")
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
        <Button variant="outline" className="h-auto flex-col gap-2 p-4">
          <Plus className="size-6" />
          <span className="text-sm">Add Recurring</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Recurring Template (Admin)</DialogTitle>
          <DialogDescription>
            Create a recurring expense template for any organization
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

            <Field>
              <FieldLabel htmlFor="categoryId">Category</FieldLabel>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  if (value) {
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                }}
                disabled={isLoading || !selectedOrgId}
                required
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

            <Field>
              <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
              <Input
                id="vendor"
                placeholder="e.g., Electric Company, Internet Provider"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                }
                disabled={isLoading}
              />
              <FieldDescription>
                The vendor or company for this recurring expense
              </FieldDescription>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="estimatedAmount">Estimated Amount</FieldLabel>
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
                <FieldLabel htmlFor="typicalDayOfMonth">Day of Month</FieldLabel>
                <Input
                  id="typicalDayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 15"
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
                rows={3}
              />
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
                {isLoading ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
