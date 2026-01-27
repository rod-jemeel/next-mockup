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
import type { RecurringTemplateWithOrg } from "@/lib/server/services/recurring-templates"

interface DeleteRecurringDialogProps {
  template: RecurringTemplateWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteRecurringDialog({ template, open, onOpenChange }: DeleteRecurringDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!template) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/recurring/${template.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: template.org_id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to delete template")
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
              <DialogTitle>Delete Recurring Template</DialogTitle>
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
            <p className="text-sm font-medium">
              {template?.name || template?.vendor || "Untitled Template"}
            </p>
            {template?.organization && (
              <p className="text-xs text-muted-foreground">
                Organization: {template.organization.name}
              </p>
            )}
            {template?.expense_categories && (
              <p className="text-xs text-muted-foreground">
                Category: {template.expense_categories.name}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Deleting this template will mark it as inactive. Past expenses created from this template will not be affected.
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
              {isLoading ? "Deleting..." : "Delete Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
