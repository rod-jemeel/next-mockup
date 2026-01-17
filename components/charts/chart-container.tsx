"use client"

import { cn } from "@/lib/utils"

interface ChartContainerProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  isLoading?: boolean
}

export function ChartContainer({
  title,
  description,
  children,
  className,
  isLoading = false,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-pulse text-muted-foreground text-sm">
            Loading chart...
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
