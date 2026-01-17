"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
})

interface InviteAdminDialogProps {
  organization: {
    id: string
    name: string
  }
}

export function InviteAdminDialog({ organization }: InviteAdminDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const result = inviteSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/super/organizations/${organization.id}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to send invitation")
      }

      setSuccess(true)
      setEmail("")
      router.refresh()

      // Close dialog after short delay
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-3.5" />
          Invite Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Organization Admin</DialogTitle>
          <DialogDescription>
            Invite an org_admin to manage{" "}
            <span className="font-medium">{organization.name}</span>. They will
            be able to invite other members and manage the organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                {error}
              </FieldError>
            )}
            {success && (
              <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-xs text-primary">
                Invitation sent successfully!
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || success}
                required
              />
              <FieldDescription>
                This person will receive an invitation email with a link to join
                as org_admin.
              </FieldDescription>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || success}>
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
