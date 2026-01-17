import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users to sign-in
  if (!session) {
    const signInUrl = new URL("/auth/sign-in", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protected routes - all routes under (protected) group
    "/dashboard/:path*",
    "/settings/:path*",
    "/expenses/:path*",
    "/inventory/:path*",
    "/super/:path*",
    "/org/select",
  ],
}
