"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

interface Category {
  id: string
  name: string
}

interface NewExpenseFormProps {
  orgId: string
}

export function NewExpenseForm({ orgId }: NewExpenseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    amount: "",
    vendor: "",
    notes: "",
  })

  useEffect(() => {
    // Fetch categories
    fetch(`/api/orgs/${orgId}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setCategories(data.data)
        }
      })
      .catch(console.error)
  }, [orgId])

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
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          vendor: formData.vendor || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create expense")
      }

      router.push("/expenses")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Expense Details</CardTitle>
        <CardDescription>
          Enter the details for your new expense
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                <FieldLabel htmlFor="amount">Amount</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  disabled={isLoading}
                  required
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
                required
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <FieldDescription>
                  No categories found. Create one in Settings.
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
                onClick={() => router.back()}
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
      </CardContent>
    </Card>
  )
}
