import { supabase } from "@/lib/server/db"
import { sendEmail, generateForwardedEmailHtml, isEmailMockMode } from "./email-sender"
import { createNotificationsForUsers } from "./notifications"
import {
  getMembersByDepartmentIds,
  getUsersByDepartmentMemberIds,
} from "./departments"
import type { DetectedEmailWithCategory } from "./detected-emails"
import type { ForwardingRuleWithCategory } from "./forwarding-rules"

interface ProcessForwardingResult {
  emailId: string
  rulesMatched: number
  notificationsSent: number
  emailsForwarded: number
  mockMode: boolean
}

/**
 * Process forwarding rules for a detected email
 * This should be called when a new email is detected/synced
 */
export async function processForwardingRules({
  email,
  orgId,
}: {
  email: DetectedEmailWithCategory
  orgId: string
}): Promise<ProcessForwardingResult> {
  const result: ProcessForwardingResult = {
    emailId: email.id,
    rulesMatched: 0,
    notificationsSent: 0,
    emailsForwarded: 0,
    mockMode: isEmailMockMode(),
  }

  // Skip if email has no category
  if (!email.category_id) {
    return result
  }

  // Get active forwarding rules for this category
  const { data: rules, error: rulesError } = await supabase
    .from("email_forwarding_rules")
    .select("*, email_categories(id, name, color)")
    .eq("org_id", orgId)
    .eq("category_id", email.category_id)
    .eq("is_active", true)

  if (rulesError) {
    console.error("Failed to fetch forwarding rules:", rulesError)
    return result
  }

  if (!rules || rules.length === 0) {
    return result
  }

  result.rulesMatched = rules.length

  // Process each matching rule
  for (const rule of rules as ForwardingRuleWithCategory[]) {
    await processRule({ email, rule, orgId, result })
  }

  // Mark email as forwarded if any rules were processed
  if (result.notificationsSent > 0 || result.emailsForwarded > 0) {
    await supabase
      .from("detected_emails")
      .update({
        is_forwarded: true,
        forwarded_at: new Date().toISOString(),
      })
      .eq("id", email.id)
  }

  return result
}

/**
 * Process a single forwarding rule
 */
async function processRule({
  email,
  rule,
  orgId,
  result,
}: {
  email: DetectedEmailWithCategory
  rule: ForwardingRuleWithCategory
  orgId: string
  result: ProcessForwardingResult
}): Promise<void> {
  // Get users to notify based on roles
  const userIds = await getUsersForRule(rule, orgId)

  if (userIds.length === 0) {
    return
  }

  const categoryName = rule.email_categories?.name || "Unknown"

  // Send in-app notifications
  if (rule.notify_in_app) {
    try {
      await createNotificationsForUsers(userIds, {
        orgId,
        type: "email_forwarded",
        title: `📧 ${email.subject}`,
        message: `From: ${email.sender_name || email.sender_email}`,
        relatedType: "detected_email",
        relatedId: email.id,
        metadata: {
          ruleName: rule.name,
          ruleId: rule.id,
          categoryName,
          senderEmail: email.sender_email,
        },
      })
      result.notificationsSent += userIds.length
    } catch (error) {
      console.error("Failed to create notifications:", error)
    }
  }

  // Forward via email
  if (rule.forward_email) {
    // Get user emails
    const { data: users } = await supabase
      .from("user")
      .select("id, email")
      .in("id", userIds)

    if (users && users.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      // Generate email content once (same for all recipients)
      const { html, text } = generateForwardedEmailHtml({
        originalSubject: email.subject,
        originalSender: email.sender_name || email.sender_email,
        originalSenderEmail: email.sender_email,
        originalSnippet: email.snippet || "",
        categoryName,
        ruleName: rule.name,
        receivedAt: email.received_at,
        appUrl,
        emailId: email.id,
      })

      // Send emails in parallel (async-parallel best practice)
      const sendPromises = users.map((user) =>
        sendEmail({
          to: user.email,
          toUserId: user.id,
          subject: `[Forwarded] ${email.subject}`,
          html,
          text,
          orgId,
          sourceType: "forwarding_rule",
          sourceId: rule.id,
          relatedEmailId: email.id,
        })
          .then(() => ({ success: true, email: user.email }))
          .catch((error) => {
            console.error(`Failed to forward email to ${user.email}:`, error)
            return { success: false, email: user.email }
          })
      )

      const results = await Promise.all(sendPromises)
      result.emailsForwarded += results.filter((r) => r.success).length
    }
  }
}

/**
 * Get user IDs that should be notified based on rule configuration
 * Resolves roles, direct user IDs, department IDs, and department member IDs
 */
async function getUsersForRule(
  rule: ForwardingRuleWithCategory,
  orgId: string
): Promise<string[]> {
  const userIds = new Set<string>()

  // 1. Add specific user IDs from the rule
  if (rule.notify_user_ids && rule.notify_user_ids.length > 0) {
    rule.notify_user_ids.forEach((id) => userIds.add(id))
  }

  // 2. Get users by role
  if (rule.notify_roles && rule.notify_roles.length > 0) {
    const { data: members } = await supabase
      .from("member")
      .select("userId")
      .eq("organizationId", orgId)
      .in("role", rule.notify_roles)

    if (members) {
      members.forEach((m) => userIds.add(m.userId))
    }
  }

  // 3. Get users by entire departments (NEW)
  // Pass orgId to verify department ownership and prevent cross-tenant data leakage
  if (rule.notify_department_ids && rule.notify_department_ids.length > 0) {
    const deptUserIds = await getMembersByDepartmentIds(rule.notify_department_ids, orgId)
    deptUserIds.forEach((id) => userIds.add(id))
  }

  // 4. Get users by specific department member IDs (NEW)
  // Pass orgId to verify member ownership and prevent cross-tenant data leakage
  if (rule.notify_department_member_ids && rule.notify_department_member_ids.length > 0) {
    const memberUserIds = await getUsersByDepartmentMemberIds(rule.notify_department_member_ids, orgId)
    memberUserIds.forEach((id) => userIds.add(id))
  }

  return Array.from(userIds)
}

/**
 * Process forwarding for multiple emails (batch)
 */
export async function processForwardingBatch({
  emails,
  orgId,
}: {
  emails: DetectedEmailWithCategory[]
  orgId: string
}): Promise<ProcessForwardingResult[]> {
  const results: ProcessForwardingResult[] = []

  for (const email of emails) {
    // Skip already forwarded emails
    if (email.is_forwarded) {
      continue
    }

    const result = await processForwardingRules({ email, orgId })
    results.push(result)
  }

  return results
}

/**
 * Get email send log for an organization
 */
export async function getEmailSendLog({
  orgId,
  limit = 50,
}: {
  orgId: string
  limit?: number
}): Promise<{
  items: Array<{
    id: string
    to_email: string
    subject: string
    status: string
    provider: string
    created_at: string
  }>
  total: number
}> {
  const { data, count, error } = await supabase
    .from("email_send_log")
    .select("id, to_email, subject, status, provider, created_at", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error

  return {
    items: data || [],
    total: count || 0,
  }
}
