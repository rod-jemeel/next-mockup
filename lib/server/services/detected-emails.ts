import { cache } from "react"
import { supabase } from "@/lib/server/db"
import type {
  UpdateDetectedEmailInput,
  ListDetectedEmailsInput,
} from "@/lib/validations/email"

export interface DetectedEmail {
  id: string
  org_id: string
  integration_id: string
  provider_email_id: string
  subject: string
  sender_email: string
  sender_name: string | null
  received_at: string
  snippet: string | null
  category_id: string | null
  auto_categorized: boolean
  confidence_score: number | null
  is_read: boolean
  is_archived: boolean
  is_forwarded: boolean
  forwarded_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DetectedEmailWithCategory extends DetectedEmail {
  email_categories?: {
    id: string
    name: string
    color: string
  } | null
}

/**
 * List detected emails for an organization
 * Uses React.cache() for per-request deduplication
 */
export const listDetectedEmails = cache(async function listDetectedEmails({
  orgId,
  query,
}: {
  orgId: string
  query: ListDetectedEmailsInput
}): Promise<{ items: DetectedEmailWithCategory[]; total: number; page: number; limit: number }> {
  const offset = (query.page - 1) * query.limit

  let queryBuilder = supabase
    .from("detected_emails")
    .select("*, email_categories(id, name, color)", { count: "exact" })
    .eq("org_id", orgId)
    .eq("is_archived", query.isArchived)
    .order("received_at", { ascending: false })
    .range(offset, offset + query.limit - 1)

  if (query.categoryId) {
    queryBuilder = queryBuilder.eq("category_id", query.categoryId)
  }

  if (query.isRead !== undefined) {
    queryBuilder = queryBuilder.eq("is_read", query.isRead)
  }

  const { data, count, error } = await queryBuilder

  if (error) throw error

  return {
    items: data || [],
    total: count || 0,
    page: query.page,
    limit: query.limit,
  }
})

export async function getDetectedEmail({
  emailId,
  orgId,
}: {
  emailId: string
  orgId: string
}): Promise<DetectedEmailWithCategory> {
  const { data, error } = await supabase
    .from("detected_emails")
    .select("*, email_categories(id, name, color)")
    .eq("id", emailId)
    .eq("org_id", orgId)
    .single()

  if (error) throw error
  return data
}

export async function updateDetectedEmail({
  emailId,
  orgId,
  data,
}: {
  emailId: string
  orgId: string
  data: UpdateDetectedEmailInput
}): Promise<DetectedEmail> {
  const updateData: Record<string, unknown> = {}

  if (data.isRead !== undefined) updateData.is_read = data.isRead
  if (data.isArchived !== undefined) updateData.is_archived = data.isArchived
  if (data.categoryId !== undefined) {
    updateData.category_id = data.categoryId
    updateData.auto_categorized = false
  }

  const { data: email, error } = await supabase
    .from("detected_emails")
    .update(updateData)
    .eq("id", emailId)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) throw error
  return email
}

export async function markEmailsAsRead({
  emailIds,
  orgId,
}: {
  emailIds: string[]
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("detected_emails")
    .update({ is_read: true })
    .in("id", emailIds)
    .eq("org_id", orgId)

  if (error) throw error
}

export async function archiveEmails({
  emailIds,
  orgId,
}: {
  emailIds: string[]
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("detected_emails")
    .update({ is_archived: true })
    .in("id", emailIds)
    .eq("org_id", orgId)

  if (error) throw error
}

/**
 * Get email counts by status for dashboard display
 */
export const getEmailCounts = cache(async function getEmailCounts({
  orgId,
}: {
  orgId: string
}): Promise<{ unread: number; total: number }> {
  const { count: total, error: totalError } = await supabase
    .from("detected_emails")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("is_archived", false)

  if (totalError) throw totalError

  const { count: unread, error: unreadError } = await supabase
    .from("detected_emails")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("is_archived", false)
    .eq("is_read", false)

  if (unreadError) throw unreadError

  return {
    unread: unread || 0,
    total: total || 0,
  }
})
