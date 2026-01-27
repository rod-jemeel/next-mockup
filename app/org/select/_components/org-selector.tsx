"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building03Icon,
  PlusSignIcon,
  Tick01Icon,
  Search01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 20

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
}

interface OrgSelectorProps {
  organizations: Organization[]
  isSuperadmin?: boolean
}

export function OrgSelector({ organizations, isSuperadmin }: OrgSelectorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { data: activeOrg } = authClient.useActiveOrganization()

  const filtered = useMemo(() => {
    if (!search.trim()) return organizations
    const q = search.toLowerCase()
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q)
    )
  }, [organizations, search])

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length))
  }, [filtered.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const handleSelectOrg = async (orgId: string) => {
    setIsLoading(orgId)
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to select organization:", error)
      setIsLoading(null)
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setIsCreating(true)
    try {
      const result = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgName.trim().toLowerCase().replace(/\s+/g, "-"),
      })

      if (result.data) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        })
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
    } finally {
      setIsCreating(false)
      setDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top toolbar: Admin Hub + Search + Create */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isSuperadmin && (
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/super">
              <HugeiconsIcon
                icon={Shield01Icon}
                strokeWidth={2}
                className="size-4"
                aria-hidden="true"
              />
              Admin Hub
            </Link>
          </Button>
        )}
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search organizations"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden="true"
              />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to manage your expenses and inventory
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrg}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Organization Name</FieldLabel>
                  <Input
                    id="org-name"
                    placeholder="My Company..."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    disabled={isCreating}
                    required
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Organization"}
                </Button>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization grid */}
      {organizations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">No organizations</CardTitle>
            <CardDescription>
              Create your first organization to get started
            </CardDescription>
          </CardHeader>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No organizations match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            role="listbox"
            aria-label="Organizations"
          >
            {visible.map((org) => {
              const isActive = activeOrg?.id === org.id
              const isCurrentlyLoading = isLoading === org.id
              return (
                <Card
                  key={org.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  role="option"
                  aria-selected={isActive}
                  aria-label={`${org.name} (${org.slug})`}
                  tabIndex={0}
                  onClick={() => handleSelectOrg(org.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelectOrg(org.id)
                    }
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <HugeiconsIcon
                        icon={Building03Icon}
                        strokeWidth={2}
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {org.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        /{org.slug}
                      </p>
                    </div>
                    {isActive && (
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        strokeWidth={2}
                        className="size-4 text-primary shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {isCurrentlyLoading && (
                      <div
                        className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                        role="status"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <div
                className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                role="status"
              >
                <span className="sr-only">Loading more...</span>
              </div>
            </div>
          )}

          {/* Count indicator when searching */}
          {search.trim() && (
            <p className="text-xs text-center text-muted-foreground tabular-nums">
              {filtered.length} of {organizations.length} organizations
            </p>
          )}
        </>
      )}
    </div>
  )
}
