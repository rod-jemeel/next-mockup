import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"
import { after } from "next/server"
import { Pool } from "pg"
import { ac, roles, adminAcInstance, adminRoles } from "./permissions"

export const auth = betterAuth({
  // Database: Supabase Postgres (use session pooler connection string)
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  // Base URL for callbacks
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Email + password authentication
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      // Non-blocking email send using after()
      after(async () => {
        // TODO: Implement email sending via Resend/SendGrid
        console.log(`Reset password for ${data.user.email}: ${data.url}`)
      })
    },
  },

  // Social providers (optional)
  ...(process.env.GOOGLE_CLIENT_ID && {
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  }),

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Plugins
  plugins: [
    organization({
      // Access control with custom permissions
      ac,
      roles,
      async sendInvitationEmail(data) {
        // Non-blocking email send using after()
        after(async () => {
          const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`
          // TODO: Implement email sending via Resend/SendGrid
          console.log(`Invite ${data.email} to ${data.organization.name}: ${inviteLink}`)
        })
      },
      allowUserToCreateOrganization: true,
    }),
    // Admin plugin for superuser functionality
    admin({
      ac: adminAcInstance,
      roles: adminRoles,
      defaultRole: "user",
    }),
    // Required for Server Actions to set cookies - must be last
    nextCookies(),
  ],
})

export type Auth = typeof auth
