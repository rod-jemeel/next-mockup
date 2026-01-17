"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Info } from "lucide-react"
import { signIn } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signInSchema, type SignInSchema } from "../_schemas/sign-in.schema"

const MESSAGE_MAP: Record<string, { title: string; description: string }> = {
  signup_disabled: {
    title: "Invite-only access",
    description:
      "Public signup is disabled. You must be invited by an organization to join.",
  },
}

interface SignInFormProps extends React.ComponentProps<"div"> {
  message?: string
}

export function SignInForm({ className, message, ...props }: SignInFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<SignInSchema>({
    email: "",
    password: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = signInSchema.safeParse(formData)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    await signIn.email({
      email: formData.email,
      password: formData.password,
      callbackURL: "/dashboard",
      fetchOptions: {
        onRequest: () => setIsLoading(true),
        onResponse: () => setIsLoading(false),
        onError: (ctx) => setError(ctx.error.message),
        onSuccess: () => router.push("/dashboard"),
      },
    })
  }

  const messageContent = message ? MESSAGE_MAP[message] : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {messageContent && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{messageContent.title}</p>
            <p className="text-xs/relaxed text-muted-foreground">
              {messageContent.description}
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  {error}
                </FieldError>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
