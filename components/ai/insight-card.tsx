"use client"

import { cn } from "@/lib/utils"
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface InsightCardProps {
  title: string
  description: string
  severity?: "info" | "warning" | "success" | "error"
}

export function InsightCard({
  title,
  description,
  severity = "info",
}: InsightCardProps) {
  const config = {
    info: {
      icon: Info,
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    success: {
      icon: CheckCircle,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
    },
  }

  const { icon: Icon, bgColor, borderColor, iconColor } = config[severity]

  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex gap-3",
        bgColor,
        borderColor
      )}
      data-slot="insight-card"
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", iconColor)} />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  )
}
