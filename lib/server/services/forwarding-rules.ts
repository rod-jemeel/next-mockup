import { cache } from "react"
import { supabase } from "@/lib/server/db"
import type {
  CreateForwardingRuleInput,
  UpdateForwardingRuleInput,
  ListForwardingRulesInput,
} from "@/lib/validations/email"

export interface ForwardingRule {
  id: string
  org_id: string
  name: string
  description: string | null
  category_id: string
  notify_roles: string[]
  notify_user_ids: string[]
  notify_department_ids: string[]
  notify_department_member_ids: string[]
  notify_in_app: boolean
  forward_email: boolean
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ForwardingRuleWithCategory extends ForwardingRule {
  email_categories?: {
    id: string
    name: string
    color: string
  }
}

/**
 * List forwarding rules for an organization
 * Uses React.cache() for per-request deduplication
 */
export const listForwardingRules = cache(async function listForwardingRules({
  orgId,
  query,
}: {
  orgId: string
  query: ListForwardingRulesInput
}): Promise<{ items: ForwardingRuleWithCategory[]; total: number }> {
  let queryBuilder = supabase
    .from("email_forwarding_rules")
    .select("*, email_categories(id, name, color)", { count: "exact" })
    .eq("org_id", orgId)
    .order("name", { ascending: true })

  if (!query.includeInactive) {
    queryBuilder = queryBuilder.eq("is_active", true)
  }

  const { data, count, error } = await queryBuilder

  if (error) throw error

  return {
    items: data || [],
    total: count || 0,
  }
})

export async function getForwardingRule({
  ruleId,
  orgId,
}: {
  ruleId: string
  orgId: string
}): Promise<ForwardingRuleWithCategory> {
  const { data, error } = await supabase
    .from("email_forwarding_rules")
    .select("*, email_categories(id, name, color)")
    .eq("id", ruleId)
    .eq("org_id", orgId)
    .single()

  if (error) throw error
  return data
}

export async function createForwardingRule({
  orgId,
  userId,
  data,
}: {
  orgId: string
  userId: string
  data: CreateForwardingRuleInput
}): Promise<ForwardingRule> {
  const { data: rule, error } = await supabase
    .from("email_forwarding_rules")
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description || null,
      category_id: data.categoryId,
      notify_roles: data.notifyRoles || [],
      notify_user_ids: data.notifyUserIds || [],
      notify_department_ids: data.notifyDepartmentIds || [],
      notify_department_member_ids: data.notifyDepartmentMemberIds || [],
      notify_in_app: data.notifyInApp,
      forward_email: data.forwardEmail,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return rule
}

export async function updateForwardingRule({
  ruleId,
  orgId,
  data,
}: {
  ruleId: string
  orgId: string
  data: UpdateForwardingRuleInput
}): Promise<ForwardingRule> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId
  if (data.notifyRoles !== undefined) updateData.notify_roles = data.notifyRoles
  if (data.notifyUserIds !== undefined) updateData.notify_user_ids = data.notifyUserIds
  if (data.notifyDepartmentIds !== undefined) updateData.notify_department_ids = data.notifyDepartmentIds
  if (data.notifyDepartmentMemberIds !== undefined) updateData.notify_department_member_ids = data.notifyDepartmentMemberIds
  if (data.notifyInApp !== undefined) updateData.notify_in_app = data.notifyInApp
  if (data.forwardEmail !== undefined) updateData.forward_email = data.forwardEmail
  if (data.isActive !== undefined) updateData.is_active = data.isActive

  const { data: rule, error } = await supabase
    .from("email_forwarding_rules")
    .update(updateData)
    .eq("id", ruleId)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) throw error
  return rule
}

export async function deleteForwardingRule({
  ruleId,
  orgId,
}: {
  ruleId: string
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("email_forwarding_rules")
    .delete()
    .eq("id", ruleId)
    .eq("org_id", orgId)

  if (error) throw error
}
