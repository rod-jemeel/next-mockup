import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/errors"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

type Session = Awaited<ReturnType<typeof auth.api.getSession>>

/**
 * Check if a user has superadmin role
 */
export function isSuperadmin(session: NonNullable<Session>): boolean {
  return session.user.role === "superadmin"
}

/**
 * Get session or redirect to login (for Server Components)
 */
export async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return session
}

/**
 * Get session or throw ApiError (for Route Handlers)
 */
export async function getSessionOrApiError() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new ApiError("UNAUTHORIZED")
  }

  return session
}

/**
 * Require superadmin access (for Route Handlers)
 * Throws ApiError if user is not a superadmin
 */
export async function requireSuperadmin() {
  const session = await getSessionOrApiError()

  if (!isSuperadmin(session)) {
    throw new ApiError("SUPERADMIN_REQUIRED")
  }

  return session
}

/**
 * Get active organization or redirect to org select
 */
export async function getActiveOrgOrThrow() {
  const session = await getSessionOrThrow()

  if (!session.session.activeOrganizationId) {
    redirect("/org/select")
  }

  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: {
      organizationId: session.session.activeOrganizationId,
    },
  })

  if (!org) {
    redirect("/org/select")
  }

  return { session, org }
}

/**
 * Require specific role(s) to access a resource
 * @param requiredRoles - Array of role names (user needs at least one)
 */
export async function requireRole(requiredRoles: string[]) {
  const { session, org } = await getActiveOrgOrThrow()

  // Find user's membership in this org
  const membership = org.members.find(
    (m) => m.userId === session.user.id
  )

  if (!membership) {
    throw new Error("Not a member of this organization")
  }

  // Check if user has any of the required roles
  const userRoles = membership.role.split(",")
  // "owner" role (Better Auth default for org creator) has full access like org_admin
  const effectiveRoles = userRoles.includes("owner")
    ? [...userRoles, "org_admin"]
    : userRoles
  const hasRole = requiredRoles.some((role) => effectiveRoles.includes(role))

  if (!hasRole) {
    throw new Error(`Role required: ${requiredRoles.join(" or ")}`)
  }

  return { session, org, membership }
}

/**
 * Verify org access by orgId from URL params (for Route Handlers).
 * Unlike requireRole(), this takes the orgId directly instead of using activeOrganizationId.
 * Superadmins bypass membership check and can access any organization.
 * @param orgId - Organization ID from URL params
 * @param requiredRoles - Optional array of role names (user needs at least one)
 */
export async function requireOrgAccess(
  orgId: string,
  requiredRoles?: string[]
) {
  const session = await getSessionOrApiError()

  // Fetch organization by ID
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  })

  if (!org) {
    throw new ApiError("ORG_NOT_FOUND")
  }

  // Superadmins bypass membership check
  if (isSuperadmin(session)) {
    return { session, org, membership: null, isSuperadmin: true }
  }

  // Verify user is a member
  const membership = org.members.find((m) => m.userId === session.user.id)

  if (!membership) {
    throw new ApiError("NOT_MEMBER")
  }

  // Check roles if specified
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = membership.role.split(",")
    // "owner" role (Better Auth default for org creator) has full access like org_admin
    const effectiveRoles = userRoles.includes("owner")
      ? [...userRoles, "org_admin"]
      : userRoles
    const hasRole = requiredRoles.some((role) => effectiveRoles.includes(role))

    if (!hasRole) {
      throw new ApiError(
        "ROLE_REQUIRED",
        `Role required: ${requiredRoles.join(" or ")}`
      )
    }
  }

  return { session, org, membership, isSuperadmin: false }
}
