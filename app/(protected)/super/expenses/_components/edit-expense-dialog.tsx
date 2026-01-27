"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type { ExpenseWithOrg } from "@/lib/server/services/expenses"

interface EditExpenseDialogProps {
  expense: ExpenseWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExpenseDialog({ expense, open, onOpenChange }: EditExpenseDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    expenseDate: "",
    totalAmount: "",
    taxAmount: "",
    vendor: "",
    notes: "",
  })

  // Load expense data when it changes
  useEffect(() => {
    if (expense) {
      setFormData({
        expenseDate: expense.expense_date,
        totalAmount: expense.amount.toString(),
        taxAmount: expense.tax_amount?.toString() || "",
        vendor: expense.vendor || "",
        notes: expense.notes || "",
      })
      setError(null)
    }
  }, [expense])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expense) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: expense.org_id,
          expenseDate: formData.expenseDate,
          totalAmount: parseFloat(formData.totalAmount),
          taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
          vendor: formData.vendor || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update expense")
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update this expense record
            {expense?.organization && (
              <span className="block mt-1 text-foreground">
                Organization: {expense.organization.name}
              </span>
            )}
            {expense?.expense_categories && (
              <span className="block text-foreground">
                Category: {expense.expense_categories.name}
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
              <FieldLabel htmlFor="expenseDate">Expense Date</FieldLabel>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expenseDate: e.target.value }))
                }
                disabled={isLoading}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="totalAmount">Total Amount</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, totalAmount: e.target.value }))
                    }
                    disabled={isLoading}
                    required
                    className="pl-7"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="taxAmount">Tax Amount</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.taxAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, taxAmount: e.target.value }))
                    }
                    disabled={isLoading}
                    className="pl-7"
                  />
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
              <Input
                id="vendor"
                placeholder="e.g., Amazon, Costco"
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
                placeholder="Additional details about this expense"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                disabled={isLoading}
                rows={2}
              />
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
