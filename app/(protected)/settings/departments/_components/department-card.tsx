"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { DepartmentWithMembers } from "@/lib/server/services/departments"

const COLOR_CLASSES: Record<string, string> = {
  gray: "bg-muted text-muted-foreground",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
}

const COLOR_DOTS: Record<string, string> = {
  gray: "bg-muted-foreground",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
}

interface DepartmentCardProps {
  department: DepartmentWithMembers
  orgId: string
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onManageMembers: () => void
}

export function DepartmentCard({
  department,
  orgId,
  canEdit,
  canDelete,
  onEdit,
  onManageMembers,
}: DepartmentCardProps) {
  const router = useRouter()
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/departments/${department.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Failed to delete department")
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to delete department:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }

  const colorClass = COLOR_CLASSES[department.color] || COLOR_CLASSES.gray
  const dotClass = COLOR_DOTS[department.color] || COLOR_DOTS.gray

  return (
    <>
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${dotClass}`} />
              <p className="text-sm font-medium">{department.name}</p>
              {!department.is_active && (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </div>
            {department.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {department.description}
              </p>
            )}
          </div>

          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="size-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onManageMembers}>
                      <Users className="size-3.5" />
                      Manage Members
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && (
                  <>
                    {canEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className={colorClass}>
            <Users className="mr-1 size-3" />
            {department.member_count || 0} member{(department.member_count || 0) !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{department.name}&quot;?
              This will remove all members from the department. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
    </>
  )
}
