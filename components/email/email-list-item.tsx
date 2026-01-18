"use client"

import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { CategoryBadge, UncategorizedBadge } from "./category-badge"

interface EmailListItemProps {
  id: string
  subject: string
  senderEmail: string
  senderName: string | null
  receivedAt: string
  snippet: string | null
  isRead: boolean
  category: {
    id: string
    name: string
    color: string
  } | null
  onClick?: () => void
  isSelected?: boolean
}

export function EmailListItem({
  subject,
  senderEmail,
  senderName,
  receivedAt,
  snippet,
  isRead,
  category,
  onClick,
  isSelected,
}: EmailListItemProps) {
  const timeAgo = formatDistanceToNow(new Date(receivedAt), { addSuffix: true })

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-border",
        "hover:bg-muted/50 cursor-pointer transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !isRead && "bg-primary/5",
        isSelected && "bg-muted"
      )}
    >
      <div
        className={cn(
          "size-2 rounded-full mt-2 shrink-0",
          isRead ? "bg-transparent" : "bg-primary"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={cn(
              "text-xs truncate",
              !isRead && "font-medium"
            )}
          >
            {subject}
          </p>
          {category ? (
            <CategoryBadge name={category.name} color={category.color} />
          ) : (
            <UncategorizedBadge />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {senderName || senderEmail} · {timeAgo}
        </p>
        {snippet && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {snippet}
          </p>
        )}
      </div>
    </div>
  )
}

export function EmailListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border">
      <div className="size-2 rounded-full mt-2 shrink-0 bg-muted animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-2.5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-2.5 w-64 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
