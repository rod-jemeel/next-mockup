"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ListPagination } from "@/components/list-pagination"
import type { DetectedEmailWithOrg } from "@/lib/server/services/detected-emails"

interface EmailCounts {
  unread: number
  total: number
  byOrg: Array<{ orgId: string; orgName: string; unread: number; total: number }>
}

interface SuperInboxContentClientProps {
  emails: DetectedEmailWithOrg[]
  total: number
  page: number
  limit: number
  counts: EmailCounts
  selectedOrgId?: string
}

export function SuperInboxContentClient({
  emails,
  total,
  page,
  limit,
  counts,
  selectedOrgId,
}: SuperInboxContentClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")

  function handleOrgChange(orgId: string | null) {
    if (!orgId) return
    const params = new URLSearchParams(searchParams.toString())
    if (orgId === "all") {
      params.delete("org")
    } else {
      params.set("org", orgId)
    }
    params.delete("page") // Reset to page 1
    router.push(`/super/inbox?${params.toString()}`)
  }

  function handleStatusChange(status: string | null) {
    if (!status) return
    setStatusFilter(status)
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    params.delete("page") // Reset to page 1
    router.push(`/super/inbox?${params.toString()}`)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Emails</p>
          <p className="text-2xl font-semibold">{counts.total}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Unread</p>
          <p className="text-2xl font-semibold text-primary">{counts.unread}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Organizations</p>
          <p className="text-2xl font-semibold">{counts.byOrg.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2">
        <Select value={selectedOrgId || "all"} onValueChange={handleOrgChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {counts.byOrg.map((org) => (
              <SelectItem key={org.orgId} value={org.orgId}>
                {org.orgName} ({org.unread}/{org.total})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email List */}
      <div className="rounded-lg border border-border overflow-hidden">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No emails found</p>
            <p className="text-xs text-muted-foreground">
              Emails will appear here when organizations receive them
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`flex items-start gap-4 px-4 py-3 hover:bg-muted/30 transition-colors ${
                  !email.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!email.is_read && (
                      <span className="size-2 rounded-full bg-primary shrink-0" />
                    )}
                    <p className={`text-sm truncate ${!email.is_read ? "font-medium" : ""}`}>
                      {email.subject || "(No Subject)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {email.sender_name || email.sender_email}
                    </p>
                    {email.email_categories && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0"
                        style={{ backgroundColor: email.email_categories.color + "20" }}
                      >
                        {email.email_categories.name}
                      </Badge>
                    )}
                  </div>
                  {email.snippet && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {email.snippet}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(email.received_at)}
                  </p>
                  {email.organization && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Building2 className="size-2.5" />
                      {email.organization.name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {total > limit && (
          <div className="border-t border-border p-2">
            <ListPagination
              total={total}
              pageSize={limit}
              currentPage={page}
              basePath="/super/inbox"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function SuperInboxContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-12 bg-muted rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2">
        <div className="h-9 w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-9 w-[140px] bg-muted rounded animate-pulse" />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse mt-2" />
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
