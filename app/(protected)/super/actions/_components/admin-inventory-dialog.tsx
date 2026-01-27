"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function AdminInventoryDialog() {
  const router = useRouter()
  const { selectedOrgId } = useAdminOrg()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unit: "",
    initialPrice: "",
  })

  function resetForm() {
    setFormData({
      name: "",
      sku: "",
      unit: "",
      initialPrice: "",
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
      const response = await fetch("/api/super/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: selectedOrgId,
          name: formData.name,
          sku: formData.sku || undefined,
          unit: formData.unit,
          initialPrice: formData.initialPrice
            ? parseFloat(formData.initialPrice)
            : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create item")
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
          <span className="text-sm">Add Inventory Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Inventory Item (Admin)</DialogTitle>
          <DialogDescription>
            Create an inventory item for any organization
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
              <FieldLabel htmlFor="name">Item Name</FieldLabel>
              <Input
                id="name"
                placeholder="e.g., Coffee Beans"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sku">SKU (optional)</FieldLabel>
              <Input
                id="sku"
                placeholder="e.g., CB-001"
                value={formData.sku}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                disabled={isLoading}
              />
              <FieldDescription>Stock keeping unit for internal tracking</FieldDescription>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="unit">Unit</FieldLabel>
                <Input
                  id="unit"
                  placeholder="e.g., kg, pcs, L"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="initialPrice">Initial Price (optional)</FieldLabel>
                <Input
                  id="initialPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.initialPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, initialPrice: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </Field>
            </div>

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
                {isLoading ? "Creating..." : "Create Item"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
