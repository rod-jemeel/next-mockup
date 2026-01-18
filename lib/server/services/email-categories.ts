import { cache } from "react"
import { supabase } from "@/lib/server/db"
import type {
  CreateEmailCategoryInput,
  UpdateEmailCategoryInput,
  ListEmailCategoriesInput,
} from "@/lib/validations/email"

export interface EmailCategory {
  id: string
  org_id: string
  name: string
  description: string | null
  color: string
  keywords: string[] | null
  sender_patterns: string[] | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * List email categories for an organization
 * Uses React.cache() for per-request deduplication
 */
export const listEmailCategories = cache(async function listEmailCategories({
  orgId,
  query,
}: {
  orgId: string
  query: ListEmailCategoriesInput
}): Promise<{ items: EmailCategory[]; total: number }> {
  let queryBuilder = supabase
    .from("email_categories")
    .select("*", { count: "exact" })
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

export async function getEmailCategory({
  categoryId,
  orgId,
}: {
  categoryId: string
  orgId: string
}): Promise<EmailCategory> {
  const { data, error } = await supabase
    .from("email_categories")
    .select("*")
    .eq("id", categoryId)
    .eq("org_id", orgId)
    .single()

  if (error) throw error
  return data
}

export async function createEmailCategory({
  orgId,
  userId,
  data,
}: {
  orgId: string
  userId: string
  data: CreateEmailCategoryInput
}): Promise<EmailCategory> {
  const { data: category, error } = await supabase
    .from("email_categories")
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description || null,
      color: data.color,
      keywords: data.keywords || null,
      sender_patterns: data.senderPatterns || null,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return category
}

export async function updateEmailCategory({
  categoryId,
  orgId,
  data,
}: {
  categoryId: string
  orgId: string
  data: UpdateEmailCategoryInput
}): Promise<EmailCategory> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.color !== undefined) updateData.color = data.color
  if (data.keywords !== undefined) updateData.keywords = data.keywords
  if (data.senderPatterns !== undefined) updateData.sender_patterns = data.senderPatterns
  if (data.isActive !== undefined) updateData.is_active = data.isActive

  const { data: category, error } = await supabase
    .from("email_categories")
    .update(updateData)
    .eq("id", categoryId)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) throw error
  return category
}

export async function deleteEmailCategory({
  categoryId,
  orgId,
}: {
  categoryId: string
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("email_categories")
    .delete()
    .eq("id", categoryId)
    .eq("org_id", orgId)

  if (error) throw error
}
