import { redirect } from "next/navigation"

/**
 * Public signup is disabled.
 * Users can only join via organization invitations.
 * Redirect to sign-in with informational message.
 */
export default function SignUpPage() {
  redirect("/auth/sign-in?message=signup_disabled")
}
