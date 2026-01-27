"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  UserPlus,
  X,
  Loader2,
  AlertTriangle,
  Percent,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROLE_OPTIONS = [
  { value: "org_admin", label: "Org Admin" },
  { value: "finance", label: "Finance" },
  { value: "inventory", label: "Inventory" },
  { value: "viewer", label: "Viewer" },
] as const

const COMMON_TAX_RATES = [
  { label: "0%", value: 0 },
  { label: "6%", value: 0.06 },
  { label: "6.25%", value: 0.0625 },
  { label: "7%", value: 0.07 },
  { label: "8%", value: 0.08 },
  { label: "8.25%", value: 0.0825 },
  { label: "10%", value: 0.1 },
] as const

interface Member {
  id: string
  userId: string
  role: string
  user: {
    name: string
    email: string
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
}

interface OrgData {
  id: string
  name: string
  slug: string
  createdAt: string
  defaultTaxRate: number
}

interface OrgDetailClientProps {
  org: OrgData
  initialMembers: Member[]
  initialInvitations: Invitation[]
}

export function OrgDetailClient({
  org,
  initialMembers,
  initialInvitations,
}: OrgDetailClientProps) {
  const router = useRouter()

  // --- Org Info State ---
  const [orgName, setOrgName] = useState(org.name)
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  // --- Settings State ---
  const [taxRate, setTaxRate] = useState(org.defaultTaxRate)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  // --- Members State ---
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [cancellingInvitation, setCancellingInvitation] = useState<string | null>(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("org_admin")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // --- Delete State ---
  const [confirmSlug, setConfirmSlug] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canDelete = confirmSlug === org.slug

  // --- Handlers ---

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setNameSuccess(false)

    if (!orgName || orgName.length < 2) {
      setNameError("Name must be at least 2 characters")
      return
    }

    setIsSavingName(true)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgName }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to rename organization")
      }

      setNameSuccess(true)
      router.refresh()
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to rename organization"
      )
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsError(null)
    setSettingsSuccess(false)

    setIsSavingSettings(true)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultTaxRate: taxRate }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update settings")
      }

      setSettingsSuccess(true)
      setTimeout(() => setSettingsSuccess(false), 3000)
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : "Failed to update settings"
      )
    } finally {
      setIsSavingSettings(false)
    }
  }

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}/members`
      )
      if (!response.ok) throw new Error("Failed to load members")
      const { data } = await response.json()
      setMembers(data.members || [])
      setInvitations(
        (data.invitations || []).filter(
          (inv: { status: string }) => inv.status === "pending"
        )
      )
    } catch (err) {
      setMembersError(
        err instanceof Error ? err.message : "Failed to load members"
      )
    }
  }, [org.id])

  const handleRoleChange = async (memberId: string, role: string | null) => {
    if (!role) return
    setUpdatingMember(memberId)
    setMembersError(null)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update role")
      }

      await fetchMembers()
      router.refresh()
    } catch (err) {
      setMembersError(
        err instanceof Error ? err.message : "Failed to update role"
      )
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMember(memberId)
    setMembersError(null)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}/members/${memberId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to remove member")
      }

      await fetchMembers()
      router.refresh()
    } catch (err) {
      setMembersError(
        err instanceof Error ? err.message : "Failed to remove member"
      )
    } finally {
      setRemovingMember(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingInvitation(invitationId)
    setMembersError(null)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}/invitations/${invitationId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to cancel invitation")
      }

      await fetchMembers()
    } catch (err) {
      setMembersError(
        err instanceof Error ? err.message : "Failed to cancel invitation"
      )
    } finally {
      setCancellingInvitation(null)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(false)

    if (!inviteEmail) {
      setInviteError("Email is required")
      return
    }

    setIsInviting(true)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to send invitation")
      }

      setInviteSuccess(true)
      setInviteEmail("")
      await fetchMembers()
      router.refresh()

      setTimeout(() => setInviteSuccess(false), 3000)
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invitation"
      )
    } finally {
      setIsInviting(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleteError(null)
    setIsDeleting(true)

    try {
      const response = await fetch(
        `/api/super/organizations/${org.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          data.error?.message || "Failed to delete organization"
        )
      }

      router.push("/super/organizations")
      router.refresh()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete organization"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default" as const
      case "org_admin":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  return (
    <div className="space-y-6">
      {/* Section 1 & 2: Organization Info + Settings (side by side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Organization Info
            </CardTitle>
            <CardDescription>
              Change the display name for this organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveName}>
              <FieldGroup>
                {nameError && (
                  <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    {nameError}
                  </FieldError>
                )}
                {nameSuccess && (
                  <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-xs text-primary">
                    Name updated successfully.
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="org-name">Name</FieldLabel>
                  <Input
                    id="org-name"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={isSavingName}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Slug</FieldLabel>
                  <p className="text-sm text-muted-foreground font-mono">
                    {org.slug}
                  </p>
                  <FieldDescription>
                    The slug cannot be changed after creation.
                  </FieldDescription>
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingName || orgName === org.name}>
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="size-4" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure default values for this organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings}>
              <FieldGroup>
                {settingsError && (
                  <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    {settingsError}
                  </FieldError>
                )}
                {settingsSuccess && (
                  <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-xs text-primary">
                    Settings updated successfully.
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="tax-rate">Default Tax Rate</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tax-rate"
                      type="number"
                      step="0.0025"
                      min="0"
                      max="0.5"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      disabled={isSavingSettings}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground tabular-nums">
                      ({(taxRate * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <FieldDescription>
                    Enter as a decimal (e.g. 0.08 for 8%). Max 50%.
                  </FieldDescription>
                </Field>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Common US state rates:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_TAX_RATES.map((rate) => (
                      <Button
                        key={rate.value}
                        type="button"
                        variant={taxRate === rate.value ? "secondary" : "outline"}
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        onClick={() => setTaxRate(rate.value)}
                        disabled={isSavingSettings}
                      >
                        {rate.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingSettings || taxRate === org.defaultTaxRate}
                  >
                    {isSavingSettings ? "Saving..." : "Save"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>
            Manage members and invitations for this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {membersError && (
            <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              {membersError}
            </FieldError>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Members ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No members yet.
              </p>
            ) : (
              <div className="space-y-1">
                {members.map((member) => {
                  const isOwner = member.role === "owner"
                  return (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {member.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-3">
                        {isOwner ? (
                          <Badge variant="default">owner</Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(val) =>
                              handleRoleChange(member.id, val)
                            }
                            disabled={updatingMember === member.id}
                          >
                            <SelectTrigger
                              className="w-[120px]"
                              size="sm"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {!isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMember === member.id}
                          >
                            {removingMember === member.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                            <span className="sr-only">Remove</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Invitations ({invitations.length})
              </h3>
              <div className="space-y-1">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border border-dashed border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{invitation.email}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={roleBadgeVariant(invitation.role)}>
                        {invitation.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          handleCancelInvitation(invitation.id)
                        }
                        disabled={cancellingInvitation === invitation.id}
                      >
                        {cancellingInvitation === invitation.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Form */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Invite New Member
            </h3>
            <form onSubmit={handleInvite}>
              <FieldGroup>
                {inviteError && (
                  <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    {inviteError}
                  </FieldError>
                )}
                {inviteSuccess && (
                  <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-xs text-primary">
                    Invitation sent successfully!
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <Field className="flex-1 min-w-0">
                    <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="user@example.com..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={isInviting}
                      required
                      spellCheck={false}
                    />
                  </Field>
                  <Field className="sm:w-[140px] shrink-0">
                    <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                    <Select
                      value={inviteRole}
                      onValueChange={(val) => val && setInviteRole(val)}
                      disabled={isInviting}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button
                    type="submit"
                    disabled={isInviting}
                    className="shrink-0 sm:w-auto w-full"
                  >
                    <UserPlus className="size-3.5 mr-1.5" />
                    {isInviting ? "Sending..." : "Invite"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {deleteError && (
              <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                {deleteError}
              </FieldError>
            )}

            <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1">
              <p>
                <span className="font-medium">Organization:</span>{" "}
                {org.name}
              </p>
              <p>
                <span className="font-medium">Slug:</span> {org.slug}
              </p>
              <p>
                <span className="font-medium">Members:</span>{" "}
                {members.length}
              </p>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
              <p className="font-medium">
                The following will be permanently deleted:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>All members and invitations</li>
                <li>All expenses and attachments</li>
                <li>All inventory items and price history</li>
                <li>All categories, tags, and departments</li>
                <li>All email accounts and forwarding rules</li>
                <li>All notifications and audit logs</li>
                <li>All uploaded files in storage</li>
              </ul>
            </div>

            <Field>
              <FieldLabel htmlFor="confirm-slug">
                Type{" "}
                <span className="font-mono font-bold">{org.slug}</span>{" "}
                to confirm
              </FieldLabel>
              <Input
                id="confirm-slug"
                type="text"
                placeholder={org.slug}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                disabled={isDeleting}
                autoComplete="off"
              />
            </Field>

            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Organization"}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
