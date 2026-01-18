"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { departmentColors } from "@/lib/validations/departments"
import type { DepartmentWithMembers } from "@/lib/server/services/departments"

const COLOR_OPTIONS = [
  { value: "gray", label: "Gray", className: "bg-muted-foreground" },
  { value: "blue", label: "Blue", className: "bg-blue-500" },
  { value: "green", label: "Green", className: "bg-green-500" },
  { value: "yellow", label: "Yellow", className: "bg-yellow-500" },
  { value: "red", label: "Red", className: "bg-red-500" },
  { value: "purple", label: "Purple", className: "bg-purple-500" },
]

interface EditDepartmentDialogProps {
  department: DepartmentWithMembers | null
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDepartmentDialog({
  department,
  orgId,
  open,
  onOpenChange,
}: EditDepartmentDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState<(typeof departmentColors)[number]>("gray")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (department) {
      setName(department.name)
      setDescription(department.description || "")
      setColor(department.color as typeof color)
      setIsActive(department.is_active)
      setError(null)
    }
  }, [department])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!department) return

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/orgs/${orgId}/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          color,
          isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update department")
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!department) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Update department details
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
              <FieldLabel htmlFor="edit-dept-name">Name</FieldLabel>
              <Input
                id="edit-dept-name"
                placeholder="e.g., Finance, Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-dept-description">Description</FieldLabel>
              <Textarea
                id="edit-dept-description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <Select value={color} onValueChange={(v) => v && setColor(v as typeof color)}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-full ${COLOR_OPTIONS.find((c) => c.value === color)?.className}`} />
                      {COLOR_OPTIONS.find((c) => c.value === color)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <span className={`size-3 rounded-full ${opt.className}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="horizontal">
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel>Active</FieldLabel>
                  <FieldDescription className="text-[10px]">
                    Inactive departments are hidden from selection
                  </FieldDescription>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
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
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
