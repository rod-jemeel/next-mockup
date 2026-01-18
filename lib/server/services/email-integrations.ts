import { cache } from "react"
import { supabase } from "@/lib/server/db"
import {
  seedMockEmailData,
  seedForwardingRules,
  seedSecondEmailAccount,
} from "@/lib/server/services/email-seed"
import { processForwardingBatch } from "@/lib/server/services/email-forwarding-processor"
import type {
  ConnectEmailAccountInput,
  ListEmailIntegrationsInput,
} from "@/lib/validations/email"

export interface EmailIntegration {
  id: string
  org_id: string
  user_id: string
  provider: "gmail" | "outlook" | "other"
  email_address: string
  is_active: boolean
  last_sync_at: string | null
  sync_error: string | null
  created_at: string
  updated_at: string
}

export interface EmailIntegrationWithUser extends EmailIntegration {
  user?: {
    name: string
    email: string
  }
}

/**
 * List email integrations for an organization
 * Uses React.cache() for per-request deduplication
 */
export const listEmailIntegrations = cache(async function listEmailIntegrations({
  orgId,
  query,
}: {
  orgId: string
  query: ListEmailIntegrationsInput
}): Promise<{ items: EmailIntegration[]; total: number }> {
  let queryBuilder = supabase
    .from("email_integrations")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

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

export async function getEmailIntegration({
  integrationId,
  orgId,
}: {
  integrationId: string
  orgId: string
}): Promise<EmailIntegration> {
  const { data, error } = await supabase
    .from("email_integrations")
    .select("*")
    .eq("id", integrationId)
    .eq("org_id", orgId)
    .single()

  if (error) throw error
  return data
}

export async function connectEmailAccount({
  orgId,
  userId,
  data,
}: {
  orgId: string
  userId: string
  data: ConnectEmailAccountInput
}): Promise<EmailIntegration> {
  // Check if this is the first integration for the org
  const { count: existingCount } = await supabase
    .from("email_integrations")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  // For MVP, we mock the OAuth flow and just create the integration
  const { data: integration, error } = await supabase
    .from("email_integrations")
    .insert({
      org_id: orgId,
      user_id: userId,
      provider: data.provider,
      email_address: data.emailAddress,
      is_active: true,
      // Mock tokens for demo
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Auto-seed demo data on first integration connect
  if (existingCount === 0) {
    try {
      await seedMockEmailData({
        orgId,
        userId,
        integrationId: integration.id,
      })
      await seedForwardingRules({ orgId, userId })
      // Add a second email account for demo
      await seedSecondEmailAccount({ orgId, userId })

      // Update sync timestamp
      await supabase
        .from("email_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integration.id)
    } catch (seedError) {
      console.error("Failed to seed demo data:", seedError)
    }
  }

  return integration
}

export async function disconnectEmailAccount({
  integrationId,
  orgId,
}: {
  integrationId: string
  orgId: string
}): Promise<void> {
  const { error } = await supabase
    .from("email_integrations")
    .delete()
    .eq("id", integrationId)
    .eq("org_id", orgId)

  if (error) throw error
}

export async function syncEmailAccount({
  integrationId,
  orgId,
}: {
  integrationId: string
  orgId: string
}): Promise<{
  syncedCount: number
  categoriesCount: number
  rulesCount: number
  forwardingResults: { notificationsSent: number; emailsForwarded: number }
}> {
  // Get the integration to find user_id
  const { data: integration, error: getError } = await supabase
    .from("email_integrations")
    .select("user_id")
    .eq("id", integrationId)
    .eq("org_id", orgId)
    .single()

  if (getError) throw getError

  // For MVP, seed mock data on sync
  const seedResult = await seedMockEmailData({
    orgId,
    userId: integration.user_id,
    integrationId,
  })

  // Also seed forwarding rules
  const rulesCount = await seedForwardingRules({
    orgId,
    userId: integration.user_id,
  })

  // Seed second demo account if not exists
  await seedSecondEmailAccount({
    orgId,
    userId: integration.user_id,
  })

  // Process forwarding rules for newly synced emails
  // Fetch recent unforwarded emails and process them
  const { data: recentEmails } = await supabase
    .from("detected_emails")
    .select("*, email_categories(id, name, color)")
    .eq("org_id", orgId)
    .eq("is_forwarded", false)
    .not("category_id", "is", null)
    .order("received_at", { ascending: false })
    .limit(10) // Process latest 10 unforwarded emails

  let forwardingResults = { notificationsSent: 0, emailsForwarded: 0 }

  if (recentEmails && recentEmails.length > 0) {
    const results = await processForwardingBatch({
      emails: recentEmails,
      orgId,
    })

    forwardingResults = results.reduce(
      (acc, r) => ({
        notificationsSent: acc.notificationsSent + r.notificationsSent,
        emailsForwarded: acc.emailsForwarded + r.emailsForwarded,
      }),
      { notificationsSent: 0, emailsForwarded: 0 }
    )
  }

  // Update the sync timestamp
  const { error } = await supabase
    .from("email_integrations")
    .update({
      last_sync_at: new Date().toISOString(),
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integrationId)
    .eq("org_id", orgId)

  if (error) throw error

  return {
    syncedCount: seedResult.emailsCount,
    categoriesCount: seedResult.categoriesCount,
    rulesCount,
    forwardingResults,
  }
}
