/**
 * AI Query Permissions
 * Determines what data a user can query based on their role
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import type { AIQueryContext } from "@/lib/ai/types"

/**
 * Get the AI query context for the current user
 * This determines what organizations and data the user can query
 */
export async function getAIQueryContext(): Promise<AIQueryContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return null
  }

  const isSuperUser = session.user.role === "superadmin"

  if (isSuperUser) {
    // Super users can query any org or across all orgs
    // But still track their active org for default queries
    return {
      scope: "global",
      allowedOrgIds: null, // null = all orgs
      canCompareOrgs: true,
      userId: session.user.id,
      userName: session.user.name,
      activeOrgId: session.session.activeOrganizationId || undefined,
    }
  }

  // Regular users can only query their active organization
  const activeOrgId = session.session.activeOrganizationId

  if (!activeOrgId) {
    return null
  }

  // Verify membership
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: activeOrgId },
  })

  if (!org) {
    return null
  }

  const membership = org.members.find((m) => m.userId === session.user.id)
  if (!membership) {
    return null
  }

  return {
    scope: "org",
    allowedOrgIds: [activeOrgId],
    canCompareOrgs: false,
    userId: session.user.id,
    userName: session.user.name,
    activeOrgId,
  }
}

/**
 * Check if the user can access a specific organization's data
 */
export function canAccessOrg(context: AIQueryContext, orgId: string): boolean {
  if (context.allowedOrgIds === null) {
    // Super user - can access any org
    return true
  }
  return context.allowedOrgIds.includes(orgId)
}

/**
 * Check if the user can perform cross-org queries
 */
export function canQueryCrossOrg(context: AIQueryContext): boolean {
  return context.canCompareOrgs
}

/**
 * Enforce org scope for queries
 * Returns the org ID to use for queries, or throws if access denied
 */
export function enforceOrgScope(
  context: AIQueryContext,
  requestedOrgId?: string
): string {
  // If specific org requested, check access
  if (requestedOrgId) {
    if (!canAccessOrg(context, requestedOrgId)) {
      throw new Error("Access denied to organization")
    }
    return requestedOrgId
  }

  // If no org specified, use the first allowed org for regular users
  if (context.allowedOrgIds && context.allowedOrgIds.length > 0) {
    return context.allowedOrgIds[0]
  }

  throw new Error("No organization specified for query")
}
