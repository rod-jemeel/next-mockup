"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"
import { DepartmentCard } from "./department-card"
import { EditDepartmentDialog } from "./edit-department-dialog"
import { DepartmentMembersDialog } from "./department-members-dialog"
import type { DepartmentWithMembers } from "@/lib/server/services/departments"

interface OrgMember {
  userId: string
  role: string
  name: string | null
  email: string
}

interface DepartmentsListProps {
  departments: DepartmentWithMembers[]
  orgId: string
  orgMembers: OrgMember[]
  isAdmin: boolean
  currentUserId: string
}

export function DepartmentsList({
  departments,
  orgId,
  orgMembers,
  isAdmin,
  currentUserId,
}: DepartmentsListProps) {
  const [editingDepartment, setEditingDepartment] = useState<DepartmentWithMembers | null>(null)
  const [managingMembersDepartment, setManagingMembersDepartment] = useState<DepartmentWithMembers | null>(null)

  if (departments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <Building2 className="mx-auto size-10 text-muted-foreground" />
        <h3 className="mt-4 text-sm font-medium">No departments yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create departments to organize your team for targeted notifications.
        </p>
      </div>
    )
  }

  // Check if current user is a manager of any department
  const userManagedDeptIds = departments
    .filter((d) =>
      d.department_members?.some(
        (m) => m.user_id === currentUserId && m.is_manager
      )
    )
    .map((d) => d.id)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {departments.map((department) => {
          const canManage = isAdmin || userManagedDeptIds.includes(department.id)
          return (
            <DepartmentCard
              key={department.id}
              department={department}
              orgId={orgId}
              canEdit={canManage}
              canDelete={isAdmin}
              onEdit={() => setEditingDepartment(department)}
              onManageMembers={() => setManagingMembersDepartment(department)}
            />
          )
        })}
      </div>

      <EditDepartmentDialog
        department={editingDepartment}
        orgId={orgId}
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
      />

      <DepartmentMembersDialog
        department={managingMembersDepartment}
        orgId={orgId}
        orgMembers={orgMembers}
        isAdmin={isAdmin}
        open={!!managingMembersDepartment}
        onOpenChange={(open) => !open && setManagingMembersDepartment(null)}
      />
    </>
  )
}
