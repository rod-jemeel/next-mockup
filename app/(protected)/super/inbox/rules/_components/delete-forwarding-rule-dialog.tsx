"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ForwardingRuleWithOrg } from "@/lib/server/services/forwarding-rules"

interface DeleteForwardingRuleDialogProps {
  rule: ForwardingRuleWithOrg | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteForwardingRuleDialog({ rule, open, onOpenChange }: DeleteForwardingRuleDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!rule) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super/forwarding-rules/${rule.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: rule.org_id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to delete rule")
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
              <DialogTitle>Delete Forwarding Rule</DialogTitle>
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
            <p className="text-sm font-medium">{rule?.name}</p>
            {rule?.description && (
              <p className="text-xs text-muted-foreground">{rule.description}</p>
            )}
            {rule?.email_categories && (
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={{ backgroundColor: rule.email_categories.color + "20" }}
              >
                {rule.email_categories.name}
              </Badge>
            )}
            {rule?.organization && (
              <p className="text-xs text-muted-foreground">
                Organization: {rule.organization.name}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            This will permanently delete this forwarding rule. Future emails matching this category will no longer be processed by this rule.
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
              {isLoading ? "Deleting..." : "Delete Rule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
