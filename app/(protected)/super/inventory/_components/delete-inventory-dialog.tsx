"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ItemWithOrg } from "@/lib/server/services/inventory"

interface DeleteInventoryDialogProps {
  item: ItemWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteInventoryDialog({ item, open, onOpenChange }: DeleteInventoryDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!item) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/inventory/items/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: item.org_id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to delete item")
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
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Inventory Item</DialogTitle>
              <DialogDescription>
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">{item?.name}</p>
            {item?.organization && (
              <p className="text-xs text-muted-foreground">
                Organization: {item.organization.name}
              </p>
            )}
            {item?.sku && (
              <p className="text-xs text-muted-foreground">
                SKU: {item.sku}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Deleting this item will mark it as inactive. Price history will be preserved.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
