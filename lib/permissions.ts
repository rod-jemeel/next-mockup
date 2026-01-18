import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access"
import {
  defaultStatements as adminDefaultStatements,
  adminAc as adminPluginAc,
} from "better-auth/plugins/admin/access"

/**
 * Custom permission statements for this application.
 * Merged with Better Auth's default organization statements.
 */
const statement = {
  ...defaultStatements,
  // Expense management
  expense: ["create", "read", "update", "delete", "approve"],
  // Inventory management
  inventory: ["create", "read", "update", "delete"],
  // Price history (append-only)
  price: ["create", "read"],
  // Dashboard and reporting
  dashboard: ["read"],
  // Attachments
  attachment: ["create", "read", "delete"],
  // Department management
  department: ["create", "read", "update", "delete", "manage_members"],
} as const

export const ac = createAccessControl(statement)

/**
 * org_admin: Full organization control + all app features
 */
export const org_admin = ac.newRole({
  ...adminAc.statements,
  expense: ["create", "read", "update", "delete", "approve"],
  inventory: ["create", "read", "update", "delete"],
  price: ["create", "read"],
  dashboard: ["read"],
  attachment: ["create", "read", "delete"],
  department: ["create", "read", "update", "delete", "manage_members"],
})

/**
 * finance: Expense management + dashboard access
 */
export const finance = ac.newRole({
  ...memberAc.statements,
  expense: ["create", "read", "update", "approve"],
  inventory: ["read"],
  price: ["read"],
  dashboard: ["read"],
  attachment: ["create", "read"],
  department: ["read"],
})

/**
 * inventory: Inventory and price management
 */
export const inventory = ac.newRole({
  ...memberAc.statements,
  expense: ["read"],
  inventory: ["create", "read", "update", "delete"],
  price: ["create", "read"],
  dashboard: ["read"],
  attachment: ["create", "read"],
  department: ["read"],
})

/**
 * viewer: Read-only access to all features
 */
export const viewer = ac.newRole({
  expense: ["read"],
  inventory: ["read"],
  price: ["read"],
  dashboard: ["read"],
  attachment: ["read"],
  department: ["read"],
})

/**
 * All roles for export to auth config (organization plugin)
 */
export const roles = {
  org_admin,
  finance,
  inventory,
  viewer,
}

/**
 * Admin plugin access control - for user-level roles (not org roles)
 */
export const adminAcInstance = createAccessControl(adminDefaultStatements)

/**
 * superadmin: System-level admin with full control over all organizations
 */
export const superadmin = adminAcInstance.newRole({
  ...adminPluginAc.statements,
})

/**
 * Admin plugin roles - only superadmin is explicitly defined
 * Users without a role get no admin permissions by default
 */
export const adminRoles = {
  superadmin,
}
