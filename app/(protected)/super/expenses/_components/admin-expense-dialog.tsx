"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
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

export function AdminExpenseDialog() {
  const router = useRouter()
  const { selectedOrgId } = useAdminOrg()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    expenseDate: "",
    categoryId: "",
    totalAmount: "",
    taxAmount: "",
    vendor: "",
    notes: "",
  })
  const [autoCalcTax, setAutoCalcTax] = useState(true)
  const defaultTaxRate = 0.0825

  // Set today's date on mount
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      expenseDate: prev.expenseDate || new Date().toISOString().split("T")[0],
    }))
  }, [])

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
      expenseDate: new Date().toISOString().split("T")[0],
      categoryId: "",
      totalAmount: "",
      taxAmount: "",
      vendor: "",
      notes: "",
    })
    setAutoCalcTax(true)
    setError(null)
  }

  function handleTotalAmountChange(value: string) {
    setFormData((prev) => {
      const newData = { ...prev, totalAmount: value }
      if (autoCalcTax && value) {
        const total = parseFloat(value)
        if (!isNaN(total) && total > 0) {
          const preTax = total / (1 + defaultTaxRate)
          const tax = total - preTax
          newData.taxAmount = tax.toFixed(2)
        }
      }
      return newData
    })
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
      const response = await fetch("/api/super/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: selectedOrgId,
          expenseDate: formData.expenseDate,
          categoryId: formData.categoryId,
          totalAmount: parseFloat(formData.totalAmount),
          taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
          vendor: formData.vendor || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create expense")
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
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense (Admin)</DialogTitle>
          <DialogDescription>
            Create an expense for any organization
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="expenseDate">Date</FieldLabel>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expenseDate: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="totalAmount">Total Amount</FieldLabel>
                <Input
                  id="totalAmount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.totalAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Field>
            </div>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="taxAmount">Tax Amount</FieldLabel>
                <label
                  htmlFor="autoCalcTax"
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <input
                    id="autoCalcTax"
                    type="checkbox"
                    checked={autoCalcTax}
                    onChange={(e) => setAutoCalcTax(e.target.checked)}
                    className="size-3 rounded border-input accent-primary"
                    disabled={isLoading}
                  />
                  Auto ({(defaultTaxRate * 100).toFixed(2)}%)
                </label>
              </div>
              <Input
                id="taxAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.taxAmount}
                onChange={(e) => {
                  setAutoCalcTax(false)
                  setFormData((prev) => ({ ...prev, taxAmount: e.target.value }))
                }}
                disabled={isLoading}
              />
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
              {categories.length === 0 && selectedOrgId && (
                <FieldDescription>
                  No categories found for this organization.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="vendor">Vendor (optional)</FieldLabel>
              <Input
                id="vendor"
                placeholder="e.g., Office Supplies Inc."
                value={formData.vendor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                }
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
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
                {isLoading ? "Creating..." : "Create Expense"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
