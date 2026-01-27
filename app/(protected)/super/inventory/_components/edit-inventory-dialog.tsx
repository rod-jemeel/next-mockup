"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import type { ItemWithOrg } from "@/lib/server/services/inventory"

interface PriceHistory {
  id: string
  unit_price: number
  currency: string
  effective_at: string
  vendor: string | null
  source: string | null
}

interface EditInventoryDialogProps {
  item: ItemWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditInventoryDialog({ item, open, onOpenChange }: EditInventoryDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [showAddPrice, setShowAddPrice] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [addingPrice, setAddingPrice] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unit: "",
    isActive: true,
  })

  // Load item data when it changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        sku: item.sku || "",
        unit: item.unit || "",
        isActive: item.is_active,
      })
      setError(null)
      setShowAddPrice(false)
      setNewPrice("")

      // Fetch price history
      setLoadingPrices(true)
      fetch(`/api/super/inventory/items/${item.id}/prices?orgId=${item.org_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.items) {
            setPriceHistory(data.data.items)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPrices(false))
    }
  }, [item])

  async function handleAddPrice() {
    if (!item || !newPrice) return
    setAddingPrice(true)

    try {
      const response = await fetch(`/api/super/inventory/items/${item.id}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: item.org_id,
          unitPrice: parseFloat(newPrice),
          source: "admin",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to add price")
      }

      const data = await response.json()
      setPriceHistory([data.data, ...priceHistory])
      setNewPrice("")
      setShowAddPrice(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setAddingPrice(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function getPriceChange(index: number): { change: number; percent: number } | null {
    if (index >= priceHistory.length - 1) return null
    const current = priceHistory[index]
    const previous = priceHistory[index + 1]
    const change = current.unit_price - previous.unit_price
    const percent = previous.unit_price !== 0
      ? (change / previous.unit_price) * 100
      : 0
    return { change, percent }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/inventory/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: item.org_id,
          name: formData.name,
          sku: formData.sku || undefined,
          unit: formData.unit,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update item")
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
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update this inventory item
            {item?.organization && (
              <span className="block mt-1 text-foreground">
                Organization: {item.organization.name}
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
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                placeholder="Item name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isLoading}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="sku">SKU (optional)</FieldLabel>
                <Input
                  id="sku"
                  placeholder="ABC-123"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="unit">Unit</FieldLabel>
                <Input
                  id="unit"
                  placeholder="e.g., lb, kg, oz"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  disabled={isLoading}
                  required
                />
              </Field>
            </div>

            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <FieldDescription>
                    Inactive items won't show in regular lists
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

        {/* Price History Section */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Price History</h3>
            {!showAddPrice && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddPrice(true)}
                className="gap-1"
              >
                <Plus className="size-3" />
                Add Price
              </Button>
            )}
          </div>

          {showAddPrice && (
            <div className="flex gap-2 mb-3">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="New price"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                disabled={addingPrice}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddPrice}
                disabled={addingPrice || !newPrice}
              >
                {addingPrice ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddPrice(false)
                  setNewPrice("")
                }}
                disabled={addingPrice}
              >
                Cancel
              </Button>
            </div>
          )}

          {loadingPrices ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : priceHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No price history recorded
            </p>
          ) : (
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {priceHistory.map((price, index) => {
                const change = getPriceChange(index)
                return (
                  <div
                    key={price.id}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(price.unit_price)}
                      </span>
                      {change && (
                        <span
                          className={`flex items-center text-xs ${
                            change.change > 0
                              ? "text-red-600"
                              : change.change < 0
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {change.change > 0 ? (
                            <TrendingUp className="size-3 mr-0.5" />
                          ) : change.change < 0 ? (
                            <TrendingDown className="size-3 mr-0.5" />
                          ) : (
                            <Minus className="size-3 mr-0.5" />
                          )}
                          {change.percent.toFixed(1)}%
                        </span>
                      )}
                      {price.source && (
                        <Badge variant="secondary" className="text-[10px]">
                          {price.source}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(price.effective_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
