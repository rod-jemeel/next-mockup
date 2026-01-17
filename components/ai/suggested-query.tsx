"use client"

import { MessageSquare } from "lucide-react"

interface SuggestedQueryProps {
  label: string
  query: string
  onClick?: () => void
}

export function SuggestedQuery({ label, query, onClick }: SuggestedQueryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
      data-slot="suggested-query"
    >
      <MessageSquare className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-foreground truncate">{label}</span>
    </button>
  )
}
