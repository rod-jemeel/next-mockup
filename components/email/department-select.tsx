"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

interface Department {
  id: string
  name: string
  color: string
  member_count?: number
  department_members?: Array<{
    id: string
    user_id: string
    user?: {
      id: string
      name: string | null
      email: string
    }
  }>
}

const COLOR_DOTS: Record<string, string> = {
  gray: "bg-muted-foreground",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
}

interface DepartmentSelectProps {
  departments: Department[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
  disabled?: boolean
}

export function DepartmentSelect({
  departments,
  selectedIds,
  onChange,
  label = "Select departments",
  disabled = false,
}: DepartmentSelectProps) {
  const [open, setOpen] = useState(false)

  const toggleDepartment = (deptId: string) => {
    if (selectedIds.includes(deptId)) {
      onChange(selectedIds.filter((id) => id !== deptId))
    } else {
      onChange([...selectedIds, deptId])
    }
  }

  const selectedDepts = departments.filter((d) => selectedIds.includes(d.id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start font-normal"
            disabled={disabled}
          >
            {selectedDepts.length === 0 ? (
              <span className="text-muted-foreground">{label}</span>
            ) : (
              <span>{selectedDepts.length} department{selectedDepts.length !== 1 ? "s" : ""} selected</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            {departments.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                No departments available
              </p>
            ) : (
              departments.map((dept) => (
                <label
                  key={dept.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.includes(dept.id)}
                    onCheckedChange={() => toggleDepartment(dept.id)}
                  />
                  <span className={`size-2 rounded-full ${COLOR_DOTS[dept.color] || COLOR_DOTS.gray}`} />
                  <span className="flex-1 text-xs truncate">{dept.name}</span>
                  {dept.member_count !== undefined && (
                    <span className="text-[10px] text-muted-foreground">
                      {dept.member_count}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedDepts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedDepts.map((dept) => (
            <Badge key={dept.id} variant="secondary" className="text-[10px] gap-1">
              <span className={`size-1.5 rounded-full ${COLOR_DOTS[dept.color] || COLOR_DOTS.gray}`} />
              {dept.name}
              <button
                type="button"
                onClick={() => toggleDepartment(dept.id)}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

interface DepartmentMemberSelectProps {
  departments: Department[]
  selectedMemberIds: string[]
  onChange: (ids: string[]) => void
  label?: string
  disabled?: boolean
}

export function DepartmentMemberSelect({
  departments,
  selectedMemberIds,
  onChange,
  label = "Select specific members",
  disabled = false,
}: DepartmentMemberSelectProps) {
  const [open, setOpen] = useState(false)
  const [expandedDepts, setExpandedDepts] = useState<string[]>([])

  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onChange(selectedMemberIds.filter((id) => id !== memberId))
    } else {
      onChange([...selectedMemberIds, memberId])
    }
  }

  const toggleDeptExpanded = (deptId: string) => {
    if (expandedDepts.includes(deptId)) {
      setExpandedDepts(expandedDepts.filter((id) => id !== deptId))
    } else {
      setExpandedDepts([...expandedDepts, deptId])
    }
  }

  // Get all selected members with their info
  const selectedMembers = departments.flatMap((d) =>
    (d.department_members || [])
      .filter((m) => selectedMemberIds.includes(m.id))
      .map((m) => ({ ...m, deptName: d.name, deptColor: d.color }))
  )

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start font-normal"
            disabled={disabled}
          >
            {selectedMembers.length === 0 ? (
              <span className="text-muted-foreground">{label}</span>
            ) : (
              <span>{selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {departments.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                No departments available
              </p>
            ) : (
              departments.map((dept) => (
                <div key={dept.id}>
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 hover:bg-muted text-left"
                    onClick={() => toggleDeptExpanded(dept.id)}
                  >
                    <span className={`size-2 rounded-full ${COLOR_DOTS[dept.color] || COLOR_DOTS.gray}`} />
                    <span className="flex-1 text-xs font-medium">{dept.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {expandedDepts.includes(dept.id) ? "−" : "+"}
                    </span>
                  </button>
                  {expandedDepts.includes(dept.id) && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      {(dept.department_members || []).length === 0 ? (
                        <p className="py-1 text-[10px] text-muted-foreground pl-2">
                          No members
                        </p>
                      ) : (
                        (dept.department_members || []).map((member) => (
                          <label
                            key={member.id}
                            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedMemberIds.includes(member.id)}
                              onCheckedChange={() => toggleMember(member.id)}
                            />
                            <span className="flex-1 text-[10px] truncate">
                              {member.user?.name || member.user?.email || "Unknown"}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedMembers.map((member) => (
            <Badge key={member.id} variant="secondary" className="text-[10px] gap-1">
              <span className={`size-1.5 rounded-full ${COLOR_DOTS[member.deptColor] || COLOR_DOTS.gray}`} />
              {member.user?.name || member.user?.email}
              <button
                type="button"
                onClick={() => toggleMember(member.id)}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
