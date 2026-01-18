"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Building2, Mail, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CategoryBadge } from "./category-badge"
import type { ForwardingRuleWithCategory } from "@/lib/server/services/forwarding-rules"
import type { DepartmentWithMembers } from "@/lib/server/services/departments"

interface RuleCardProps {
  rule: ForwardingRuleWithCategory
  orgId: string
  departments: DepartmentWithMembers[]
  onEdit: (rule: ForwardingRuleWithCategory) => void
}

export function RuleCard({ rule, orgId, departments, onEdit }: RuleCardProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleToggleActive() {
    setIsUpdating(true)
    try {
      await fetch(`/api/orgs/${orgId}/email/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.is_active }),
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to update rule:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await fetch(`/api/orgs/${orgId}/email/rules/${rule.id}`, {
        method: "DELETE",
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to delete rule:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const roleLabels: Record<string, string> = {
    org_admin: "Admin",
    finance: "Finance",
    inventory: "Inventory",
    viewer: "Viewer",
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">{rule.name}</p>
          <Badge
            variant={rule.is_active ? "default" : "secondary"}
            className="text-[10px]"
          >
            {rule.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>When:</span>
          {rule.email_categories ? (
            <CategoryBadge
              name={rule.email_categories.name}
              color={rule.email_categories.color}
            />
          ) : (
            <span className="text-destructive">Category deleted</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          {rule.notify_roles.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <span>
                {rule.notify_roles.map((r) => roleLabels[r] || r).join(", ")}
              </span>
            </div>
          )}

          {rule.notify_department_ids && rule.notify_department_ids.length > 0 && (
            <div className="flex items-center gap-1">
              <Building2 className="size-3" />
              <span>
                {rule.notify_department_ids
                  .map((id) => departments.find((d) => d.id === id)?.name || "Unknown")
                  .join(", ")}
              </span>
            </div>
          )}

          {rule.notify_department_member_ids && rule.notify_department_member_ids.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <span>
                {rule.notify_department_member_ids.length} specific member
                {rule.notify_department_member_ids.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {rule.notify_in_app && (
              <div className="flex items-center gap-1">
                <Bell className="size-3" />
                <span>In-app</span>
              </div>
            )}
            {rule.forward_email && (
              <div className="flex items-center gap-1">
                <Mail className="size-3" />
                <span>Email</span>
              </div>
            )}
          </div>
        </div>

        {rule.description && (
          <p className="text-[10px] text-muted-foreground">{rule.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={rule.is_active}
          onCheckedChange={handleToggleActive}
          disabled={isUpdating}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(rule)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              />
            }
          >
            <Trash2 className="size-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Forwarding Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{rule.name}&quot;?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function RuleCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          <div className="h-5 w-14 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-2.5 w-40 bg-muted rounded animate-pulse" />
        <div className="h-2.5 w-56 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-5 w-9 bg-muted rounded-full animate-pulse" />
        <div className="h-7 w-7 bg-muted rounded animate-pulse" />
        <div className="h-7 w-7 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
