"use client"

import { Download, Bell, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionButtonProps {
  label: string
  action: "export_csv" | "set_alert" | "view_details"
  onClick?: () => void
}

export function ActionButton({ label, action, onClick }: ActionButtonProps) {
  const Icon = {
    export_csv: Download,
    set_alert: Bell,
    view_details: ExternalLink,
  }[action]

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      data-slot="action-button"
    >
      <Icon />
      {label}
    </Button>
  )
}
