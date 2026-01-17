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

interface AddPriceDialogProps {
  itemId: string
  orgId: string
  unit: string
}

export function AddPriceDialog({ itemId, orgId, unit }: AddPriceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    unitPrice: "",
    vendor: "",
    note: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/orgs/${orgId}/inventory/items/${itemId}/prices`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitPrice: parseFloat(formData.unitPrice),
            vendor: formData.vendor || undefined,
            note: formData.note || undefined,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to add price")
      }

      setOpen(false)
      setFormData({ unitPrice: "", vendor: "", note: "" })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          Add Price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Price</DialogTitle>
          <DialogDescription>
            Record a new price entry for this item. Previous prices are
            preserved for history tracking.
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
              <FieldLabel htmlFor="unitPrice">Unit Price</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unitPrice: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  required
                />
                <span className="text-sm text-muted-foreground">/ {unit}</span>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="vendor">Vendor (optional)</FieldLabel>
              <Input
                id="vendor"
                placeholder="e.g., Supplier Name"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                }
                disabled={isLoading}
              />
              <FieldDescription>
                Track which vendor offered this price
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
              <Textarea
                id="note"
                placeholder="Any additional context..."
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
                disabled={isLoading}
                rows={2}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Price"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
