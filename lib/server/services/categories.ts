import { cache } from "react"
import { supabase } from "@/lib/server/db"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesInput,
} from "@/lib/validations/category"

export interface Category {
  id: string
  org_id: string
  name: string
  is_active: boolean
  created_at: string
}

/**
 * List categories for an organization
 * Uses React.cache() for per-request deduplication (server-cache-react rule)
 */
export const listCategories = cache(async function listCategories({
  orgId,
  query,
}: {
  orgId: string
  query: ListCategoriesInput
}): Promise<{ items: Category[]; total: number }> {
  let queryBuilder = supabase
    .from("expense_categories")
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

export async function getCategory({
  categoryId,
  orgId,
}: {
  categoryId: string
  orgId: string
}): Promise<Category> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("id", categoryId)
    .eq("org_id", orgId)
    .single()

  if (error) throw error
  return data
}

export async function createCategory({
  orgId,
  data,
}: {
  orgId: string
  data: CreateCategoryInput
}): Promise<Category> {
  const { data: category, error } = await supabase
    .from("expense_categories")
    .insert({
      org_id: orgId,
      name: data.name,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return category
}

export async function updateCategory({
  categoryId,
  orgId,
  data,
}: {
  categoryId: string
  orgId: string
  data: UpdateCategoryInput
}): Promise<Category> {
  const { data: category, error } = await supabase
    .from("expense_categories")
    .update(data)
    .eq("id", categoryId)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) throw error
  return category
}

export async function deleteCategory({
  categoryId,
  orgId,
}: {
  categoryId: string
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", categoryId)
    .eq("org_id", orgId)

  if (error) throw error
}
