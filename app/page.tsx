import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function HomeRedirect() {
  // Mark as dynamic - auth requires request headers
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Redirect to dashboard if authenticated, otherwise to sign-in
  // redirect() throws and never returns, but TypeScript needs a return
  if (session) {
    redirect("/dashboard")
  }
  redirect("/auth/sign-in")

  // Unreachable - redirect() always throws
  return null
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  )
}