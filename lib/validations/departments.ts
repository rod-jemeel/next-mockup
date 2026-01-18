import { z } from "zod"

// Department colors
export const departmentColors = ["gray", "blue", "green", "yellow", "red", "purple"] as const
export type DepartmentColor = (typeof departmentColors)[number]

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.enum(departmentColors).default("gray"),
})

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.enum(departmentColors).optional(),
  isActive: z.boolean().optional(),
})

export const listDepartmentsSchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
})

// Department member schemas
export const addDepartmentMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  isManager: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
})

export const updateDepartmentMemberSchema = z.object({
  isManager: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
})

export const listDepartmentMembersSchema = z.object({
  includeAllDepartments: z.coerce.boolean().optional().default(false),
})

// Type exports
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>
export type ListDepartmentsInput = z.infer<typeof listDepartmentsSchema>

export type AddDepartmentMemberInput = z.infer<typeof addDepartmentMemberSchema>
export type UpdateDepartmentMemberInput = z.infer<typeof updateDepartmentMemberSchema>
export type ListDepartmentMembersInput = z.infer<typeof listDepartmentMembersSchema>
