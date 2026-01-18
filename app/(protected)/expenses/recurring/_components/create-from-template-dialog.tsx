"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileImage } from "lucide-react"
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

interface RecurringTemplate {
  id: string
  org_id: string
  category_id: string
  vendor: string | null
  estimated_amount: number | null
  notes: string | null
  frequency: string
  typical_day_of_month: number | null
  is_active: boolean
  expense_categories: { id: string; name: string } | null
}

interface CreateFromTemplateDialogProps {
  template: RecurringTemplate
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFromTemplateDialog({
  template,
  orgId,
  open,
  onOpenChange,
}: CreateFromTemplateDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    expenseDate: "",
    totalAmount: "",
    taxAmount: "",
    vendor: template.vendor || "",
    notes: template.notes || "",
  })
  const [autoCalcTax, setAutoCalcTax] = useState(true)
  const defaultTaxRate = 0.0825 // 8.25% Texas default

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      const totalAmount = template.estimated_amount?.toString() || ""
      let taxAmount = ""
      if (totalAmount && autoCalcTax) {
        const total = parseFloat(totalAmount)
        if (!isNaN(total) && total > 0) {
          const preTax = total / (1 + defaultTaxRate)
          taxAmount = (total - preTax).toFixed(2)
        }
      }
      setFormData({
        expenseDate: new Date().toISOString().split("T")[0],
        totalAmount,
        taxAmount,
        vendor: template.vendor || "",
        notes: template.notes || "",
      })
      setError(null)
    }
  }, [open, template, autoCalcTax, defaultTaxRate])

  // Calculate tax when total amount changes
  function handleTotalAmountChange(value: string) {
    setFormData((prev) => {
      const newData = { ...prev, totalAmount: value }
      if (autoCalcTax && value) {
        const total = parseFloat(value)
        if (!isNaN(total) && total > 0) {
          const preTax = total / (1 + defaultTaxRate)
          newData.taxAmount = (total - preTax).toFixed(2)
        }
      }
      return newData
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/orgs/${orgId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseDate: formData.expenseDate,
          categoryId: template.category_id,
          totalAmount: parseFloat(formData.totalAmount),
          taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
          vendor: formData.vendor || undefined,
          notes: formData.notes || undefined,
          recurringTemplateId: template.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create expense")
      }

      onOpenChange(false)
      router.refresh()
      // Navigate to expenses page to see the new expense
      router.push("/expenses")
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
          <DialogTitle>Create Expense from Template</DialogTitle>
          <DialogDescription>
            Create a new expense based on this recurring template
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {template.expense_categories?.name || "Uncategorized"}
            </Badge>
            {template.vendor && (
              <span className="text-muted-foreground">{template.vendor}</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                {error}
              </FieldError>
            )}

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
                <FieldDescription>Amount paid including tax</FieldDescription>
              </Field>
            </div>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="taxAmount">Tax Amount</FieldLabel>
                <label htmlFor="autoCalcTaxTemplate" className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    id="autoCalcTaxTemplate"
                    type="checkbox"
                    checked={autoCalcTax}
                    onChange={(e) => setAutoCalcTax(e.target.checked)}
                    className="size-3 rounded border-input accent-primary"
                    disabled={isLoading}
                  />
                  Auto-calculate ({(defaultTaxRate * 100).toFixed(2)}%)
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
              <FieldDescription>
                {autoCalcTax
                  ? "Calculated automatically from total"
                  : "Enter tax amount manually"}
              </FieldDescription>
            </Field>

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

            {/* Smart Receipt Upload - Coming Soon */}
            <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <FileImage className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Smart Receipt Scanner</p>
                    <Badge variant="secondary" className="text-[10px]">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a receipt or invoice and AI will auto-fill the form
                  </p>
                </div>
              </div>
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Expense"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
