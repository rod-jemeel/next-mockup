import { cache } from "react"
import { supabase } from "@/lib/server/db"
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ListDepartmentsInput,
  AddDepartmentMemberInput,
  UpdateDepartmentMemberInput,
} from "@/lib/validations/departments"

export interface Department {
  id: string
  org_id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface DepartmentMember {
  id: string
  department_id: string
  user_id: string
  is_manager: boolean
  is_primary: boolean
  joined_at: string
  added_by: string
}

export interface DepartmentMemberWithUser extends DepartmentMember {
  user?: {
    id: string
    name: string | null
    email: string
  }
}

export interface DepartmentWithMembers extends Department {
  department_members?: DepartmentMemberWithUser[]
  member_count?: number
}

/**
 * List departments for an organization
 * Uses React.cache() for per-request deduplication
 */
export const listDepartments = cache(async function listDepartments({
  orgId,
  query,
}: {
  orgId: string
  query: ListDepartmentsInput
}): Promise<{ items: DepartmentWithMembers[]; total: number }> {
  let queryBuilder = supabase
    .from("departments")
    .select(`
      *,
      department_members(
        id,
        user_id,
        is_manager,
        user:user_id(id, name, email)
      )
    `, { count: "exact" })
    .eq("org_id", orgId)
    .order("name", { ascending: true })

  if (!query.includeInactive) {
    queryBuilder = queryBuilder.eq("is_active", true)
  }

  const { data, count, error } = await queryBuilder

  if (error) throw error

  // Add member count
  const items = (data || []).map((dept) => ({
    ...dept,
    member_count: dept.department_members?.length || 0,
  }))

  return {
    items,
    total: count || 0,
  }
})

/**
 * Get a single department by ID
 */
export async function getDepartment({
  deptId,
  orgId,
}: {
  deptId: string
  orgId: string
}): Promise<DepartmentWithMembers> {
  const { data, error } = await supabase
    .from("departments")
    .select(`
      *,
      department_members(
        id,
        user_id,
        is_manager,
        is_primary,
        joined_at,
        added_by,
        user:user_id(id, name, email)
      )
    `)
    .eq("id", deptId)
    .eq("org_id", orgId)
    .single()

  if (error) throw error
  return {
    ...data,
    member_count: data.department_members?.length || 0,
  }
}

/**
 * Create a new department
 */
export async function createDepartment({
  orgId,
  userId,
  data,
}: {
  orgId: string
  userId: string
  data: CreateDepartmentInput
}): Promise<Department> {
  const { data: dept, error } = await supabase
    .from("departments")
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description || null,
      color: data.color,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return dept
}

/**
 * Update a department
 */
export async function updateDepartment({
  deptId,
  orgId,
  data,
}: {
  deptId: string
  orgId: string
  data: UpdateDepartmentInput
}): Promise<Department> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.color !== undefined) updateData.color = data.color
  if (data.isActive !== undefined) updateData.is_active = data.isActive

  const { data: dept, error } = await supabase
    .from("departments")
    .update(updateData)
    .eq("id", deptId)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) throw error
  return dept
}

/**
 * Delete a department (cascades to members)
 */
export async function deleteDepartment({
  deptId,
  orgId,
}: {
  deptId: string
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", deptId)
    .eq("org_id", orgId)

  if (error) throw error
}

// ============ Department Members ============

/**
 * List members of a department
 */
export const listDepartmentMembers = cache(async function listDepartmentMembers({
  deptId,
  orgId,
}: {
  deptId: string
  orgId: string
}): Promise<{ items: DepartmentMemberWithUser[]; total: number }> {
  // First verify department belongs to org
  const { data: dept, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("id", deptId)
    .eq("org_id", orgId)
    .single()

  if (deptError || !dept) {
    throw new Error("Department not found")
  }

  const { data, count, error } = await supabase
    .from("department_members")
    .select(`
      *,
      user:user_id(id, name, email)
    `, { count: "exact" })
    .eq("department_id", deptId)
    .order("is_manager", { ascending: false })
    .order("joined_at", { ascending: true })

  if (error) throw error

  return {
    items: data || [],
    total: count || 0,
  }
})

/**
 * Add a member to a department
 */
export async function addDepartmentMember({
  deptId,
  orgId,
  addedBy,
  data,
}: {
  deptId: string
  orgId: string
  addedBy: string
  data: AddDepartmentMemberInput
}): Promise<DepartmentMember> {
  // First verify department belongs to org
  const { data: dept, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("id", deptId)
    .eq("org_id", orgId)
    .single()

  if (deptError || !dept) {
    throw new Error("Department not found")
  }

  const { data: member, error } = await supabase
    .from("department_members")
    .insert({
      department_id: deptId,
      user_id: data.userId,
      is_manager: data.isManager,
      is_primary: data.isPrimary,
      added_by: addedBy,
    })
    .select()
    .single()

  if (error) throw error
  return member
}

/**
 * Update a department member
 */
export async function updateDepartmentMember({
  memberId,
  deptId,
  orgId,
  data,
}: {
  memberId: string
  deptId: string
  orgId: string
  data: UpdateDepartmentMemberInput
}): Promise<DepartmentMember> {
  // Verify department belongs to org
  const { data: dept, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("id", deptId)
    .eq("org_id", orgId)
    .single()

  if (deptError || !dept) {
    throw new Error("Department not found")
  }

  const updateData: Record<string, unknown> = {}
  if (data.isManager !== undefined) updateData.is_manager = data.isManager
  if (data.isPrimary !== undefined) updateData.is_primary = data.isPrimary

  const { data: member, error } = await supabase
    .from("department_members")
    .update(updateData)
    .eq("id", memberId)
    .eq("department_id", deptId)
    .select()
    .single()

  if (error) throw error
  return member
}

/**
 * Remove a member from a department
 */
export async function removeDepartmentMember({
  memberId,
  deptId,
  orgId,
}: {
  memberId: string
  deptId: string
  orgId: string
}): Promise<void> {
  // Verify department belongs to org
  const { data: dept, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("id", deptId)
    .eq("org_id", orgId)
    .single()

  if (deptError || !dept) {
    throw new Error("Department not found")
  }

  const { error } = await supabase
    .from("department_members")
    .delete()
    .eq("id", memberId)
    .eq("department_id", deptId)

  if (error) throw error
}

/**
 * Get all departments a user belongs to
 */
export async function getUserDepartments({
  userId,
  orgId,
}: {
  userId: string
  orgId: string
}): Promise<Department[]> {
  // Get department IDs the user belongs to
  const { data: memberData, error: memberError } = await supabase
    .from("department_members")
    .select("department_id")
    .eq("user_id", userId)

  if (memberError) throw memberError
  if (!memberData || memberData.length === 0) return []

  const deptIds = memberData.map((m) => m.department_id)

  // Get departments that are in this org and active
  const { data: depts, error: deptError } = await supabase
    .from("departments")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .in("id", deptIds)

  if (deptError) throw deptError

  return depts || []
}

/**
 * Check if user is a manager of a specific department
 */
export async function isDepartmentManager({
  userId,
  deptId,
}: {
  userId: string
  deptId: string
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("department_members")
    .select("is_manager")
    .eq("user_id", userId)
    .eq("department_id", deptId)
    .single()

  if (error || !data) return false
  return data.is_manager
}

/**
 * Get members by department IDs (for forwarding rule resolution)
 * Verifies department ownership by org_id to prevent cross-tenant data leakage
 */
export async function getMembersByDepartmentIds(
  departmentIds: string[],
  orgId: string
): Promise<string[]> {
  if (departmentIds.length === 0) return []

  // First verify all departments belong to this org (prevents cross-tenant leakage)
  const { data: validDepts, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("org_id", orgId)
    .in("id", departmentIds)

  if (deptError) throw deptError

  const validDeptIds = (validDepts || []).map((d) => d.id)
  if (validDeptIds.length === 0) return []

  const { data, error } = await supabase
    .from("department_members")
    .select("user_id")
    .in("department_id", validDeptIds)

  if (error) throw error

  // Return unique user IDs
  return [...new Set((data || []).map((m) => m.user_id))]
}

/**
 * Get user IDs by department member IDs (for forwarding rule resolution)
 * Verifies member ownership through departments.org_id to prevent cross-tenant data leakage
 */
export async function getUsersByDepartmentMemberIds(
  memberIds: string[],
  orgId: string
): Promise<string[]> {
  if (memberIds.length === 0) return []

  // Join through departments to verify org ownership (prevents cross-tenant leakage)
  const { data, error } = await supabase
    .from("department_members")
    .select(`
      user_id,
      departments!inner(org_id)
    `)
    .in("id", memberIds)
    .eq("departments.org_id", orgId)

  if (error) throw error

  return [...new Set((data || []).map((m) => m.user_id))]
}
