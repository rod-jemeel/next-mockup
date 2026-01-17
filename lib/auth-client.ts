"use client"

import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { ac, roles, adminAcInstance, adminRoles } from "./permissions"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient({
      ac,
      roles,
    }),
    adminClient({
      ac: adminAcInstance,
      roles: adminRoles,
    }),
  ],
})

// Export hooks and methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient
