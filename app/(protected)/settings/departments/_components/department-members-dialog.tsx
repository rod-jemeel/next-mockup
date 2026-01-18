"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Shield, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { DepartmentWithMembers, DepartmentMemberWithUser } from "@/lib/server/services/departments"

interface OrgMember {
  userId: string
  role: string
  name: string | null
  email: string
}

interface DepartmentMembersDialogProps {
  department: DepartmentWithMembers | null
  orgId: string
  orgMembers: OrgMember[]
  isAdmin: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepartmentMembersDialog({
  department,
  orgId,
  orgMembers,
  isAdmin,
  open,
  onOpenChange,
}: DepartmentMembersDialogProps) {
  const router = useRouter()
  const [members, setMembers] = useState<DepartmentMemberWithUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [removingMember, setRemovingMember] = useState<DepartmentMemberWithUser | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (department?.department_members) {
      setMembers(department.department_members)
    }
  }, [department])

  // Filter out already added members
  const availableMembers = orgMembers.filter(
    (om) => !members.some((m) => m.user_id === om.userId)
  )

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  async function handleAddMember() {
    if (!department || !selectedUserId) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/departments/${department.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUserId }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to add member")
      }

      const { data: newMember } = await response.json()

      // Find the user info
      const orgMember = orgMembers.find((om) => om.userId === selectedUserId)
      if (orgMember) {
        setMembers([
          ...members,
          {
            ...newMember,
            user: {
              id: orgMember.userId,
              name: orgMember.name,
              email: orgMember.email,
            },
          },
        ])
      }

      setSelectedUserId("")
      router.refresh()
    } catch (error) {
      console.error("Failed to add member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleManager(member: DepartmentMemberWithUser) {
    if (!department) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/departments/${department.id}/members/${member.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isManager: !member.is_manager }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update member")
      }

      setMembers(
        members.map((m) =>
          m.id === member.id ? { ...m, is_manager: !m.is_manager } : m
        )
      )
      router.refresh()
    } catch (error) {
      console.error("Failed to update member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveMember() {
    if (!department || !removingMember) return

    setIsRemoving(true)
    try {
      const response = await fetch(
        `/api/orgs/${orgId}/departments/${department.id}/members/${removingMember.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      setMembers(members.filter((m) => m.id !== removingMember.id))
      router.refresh()
    } catch (error) {
      console.error("Failed to remove member:", error)
    } finally {
      setIsRemoving(false)
      setRemovingMember(null)
    }
  }

  if (!department) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Add or remove members from {department.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add member section */}
            {availableMembers.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={(v) => v && setSelectedUserId(v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a member to add">
                      {selectedUserId
                        ? availableMembers.find((om) => om.userId === selectedUserId)?.name ||
                          availableMembers.find((om) => om.userId === selectedUserId)?.email
                        : "Select a member to add"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((om) => (
                      <SelectItem key={om.userId} value={om.userId}>
                        {om.name || om.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={!selectedUserId || isLoading}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            )}

            {/* Members list */}
            {members.length === 0 ? (
              <div className="py-8 text-center">
                <User className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">
                  No members in this department yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(
                            member.user?.name || null,
                            member.user?.email || ""
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">
                          {member.user?.name || member.user?.email}
                        </p>
                        {member.user?.name && (
                          <p className="text-[10px] text-muted-foreground">
                            {member.user.email}
                          </p>
                        )}
                      </div>
                      {member.is_manager && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Shield className="mr-1 size-2.5" />
                          Manager
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleManager(member)}
                          disabled={isLoading}
                          title={member.is_manager ? "Remove manager" : "Make manager"}
                        >
                          <Shield
                            className={`size-3.5 ${
                              member.is_manager
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRemovingMember(member)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removingMember}
        onOpenChange={() => setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {removingMember?.user?.name || removingMember?.user?.email}
              </span>{" "}
              from {department?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
