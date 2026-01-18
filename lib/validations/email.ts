import { z } from "zod"

// Email category colors
export const emailCategoryColors = ["blue", "green", "yellow", "red", "gray"] as const
export type EmailCategoryColor = (typeof emailCategoryColors)[number]

// Email providers
export const emailProviders = ["gmail", "outlook", "other"] as const
export type EmailProvider = (typeof emailProviders)[number]

// Roles for forwarding rules
export const orgRoles = ["org_admin", "finance", "inventory", "viewer"] as const

// Email Categories
export const createEmailCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
  color: z.enum(emailCategoryColors).default("gray"),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  senderPatterns: z.array(z.string().max(100)).max(10).optional(),
})

export const updateEmailCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).nullable().optional(),
  color: z.enum(emailCategoryColors).optional(),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  senderPatterns: z.array(z.string().max(100)).max(10).optional(),
  isActive: z.boolean().optional(),
})

export const listEmailCategoriesSchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
})

// Forwarding Rules
export const createForwardingRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  notifyRoles: z.array(z.enum(orgRoles)).optional(),
  notifyUserIds: z.array(z.string()).optional(),
  notifyDepartmentIds: z.array(z.string().uuid()).optional(),
  notifyDepartmentMemberIds: z.array(z.string().uuid()).optional(),
  notifyInApp: z.boolean().default(true),
  forwardEmail: z.boolean().default(false),
})

export const updateForwardingRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().optional(),
  notifyRoles: z.array(z.enum(orgRoles)).optional(),
  notifyUserIds: z.array(z.string()).optional(),
  notifyDepartmentIds: z.array(z.string().uuid()).optional(),
  notifyDepartmentMemberIds: z.array(z.string().uuid()).optional(),
  notifyInApp: z.boolean().optional(),
  forwardEmail: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const listForwardingRulesSchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
})

// Detected Emails
export const updateDetectedEmailSchema = z.object({
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  categoryId: z.string().uuid().nullable().optional(),
})

export const listDetectedEmailsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  isRead: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// Email Integrations
export const connectEmailAccountSchema = z.object({
  provider: z.enum(["gmail", "outlook"]),
  emailAddress: z.string().email(),
})

export const listEmailIntegrationsSchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
})

// Type exports
export type CreateEmailCategoryInput = z.infer<typeof createEmailCategorySchema>
export type UpdateEmailCategoryInput = z.infer<typeof updateEmailCategorySchema>
export type ListEmailCategoriesInput = z.infer<typeof listEmailCategoriesSchema>

export type CreateForwardingRuleInput = z.infer<typeof createForwardingRuleSchema>
export type UpdateForwardingRuleInput = z.infer<typeof updateForwardingRuleSchema>
export type ListForwardingRulesInput = z.infer<typeof listForwardingRulesSchema>

export type UpdateDetectedEmailInput = z.infer<typeof updateDetectedEmailSchema>
export type ListDetectedEmailsInput = z.infer<typeof listDetectedEmailsSchema>

export type ConnectEmailAccountInput = z.infer<typeof connectEmailAccountSchema>
export type ListEmailIntegrationsInput = z.infer<typeof listEmailIntegrationsSchema>
