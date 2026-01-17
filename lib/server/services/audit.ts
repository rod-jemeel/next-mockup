/**
 * Audit Logging Service
 *
 * Tracks CRUD operations for compliance and debugging.
 * All audit logs are org-scoped and include user context.
 */

import { supabase } from "@/lib/server/db"

export type AuditAction = "create" | "update" | "delete" | "approve"

export type AuditEntityType =
  | "expense"
  | "inventory_item"
  | "price_history"
  | "category"
  | "attachment"
  | "dashboard_preferences"

interface AuditLogEntry {
  orgId: string
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  changes?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event
 *
 * This is designed to be non-blocking - failures are logged but don't throw.
 * Use this after successful CRUD operations.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      org_id: entry.orgId,
      user_id: entry.userId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      changes: entry.changes || null,
      metadata: entry.metadata || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    })

    if (error) {
      console.error("Failed to write audit log:", error)
    }
  } catch (err) {
    console.error("Audit logging error:", err)
  }
}

/**
 * Helper to create a diff between before and after states
 */
export function createChangeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): { before?: Record<string, unknown>; after?: Record<string, unknown> } | undefined {
  if (!before && !after) return undefined
  return {
    ...(before && { before }),
    ...(after && { after }),
  }
}

/**
 * Convenience function for logging create operations
 */
export async function logCreate(
  orgId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logAudit({
    orgId,
    userId,
    action: "create",
    entityType,
    entityId,
    changes: { after: data },
    metadata,
  })
}

/**
 * Convenience function for logging update operations
 */
export async function logUpdate(
  orgId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logAudit({
    orgId,
    userId,
    action: "update",
    entityType,
    entityId,
    changes: { before, after },
    metadata,
  })
}

/**
 * Convenience function for logging delete operations
 */
export async function logDelete(
  orgId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  deletedData: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logAudit({
    orgId,
    userId,
    action: "delete",
    entityType,
    entityId,
    changes: { before: deletedData },
    metadata,
  })
}

/**
 * Query audit logs for an organization
 */
export async function getAuditLogs(params: {
  orgId: string
  entityType?: AuditEntityType
  entityId?: string
  userId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<{
  logs: Array<{
    id: string
    orgId: string
    userId: string
    action: AuditAction
    entityType: AuditEntityType
    entityId: string
    changes: Record<string, unknown> | null
    metadata: Record<string, unknown> | null
    createdAt: string
  }>
  total: number
}> {
  const {
    orgId,
    entityType,
    entityId,
    userId,
    action,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = params

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityType) {
    query = query.eq("entity_type", entityType)
  }
  if (entityId) {
    query = query.eq("entity_id", entityId)
  }
  if (userId) {
    query = query.eq("user_id", userId)
  }
  if (action) {
    query = query.eq("action", action)
  }
  if (startDate) {
    query = query.gte("created_at", startDate.toISOString())
  }
  if (endDate) {
    query = query.lte("created_at", endDate.toISOString())
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Failed to query audit logs:", error)
    return { logs: [], total: 0 }
  }

  return {
    logs: (data || []).map((log) => ({
      id: log.id,
      orgId: log.org_id,
      userId: log.user_id,
      action: log.action as AuditAction,
      entityType: log.entity_type as AuditEntityType,
      entityId: log.entity_id,
      changes: log.changes,
      metadata: log.metadata,
      createdAt: log.created_at,
    })),
    total: count || 0,
  }
}
