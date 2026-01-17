"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  KpiId,
  KPI_REGISTRY,
  KpiCategory,
  getOrgAvailableKpis,
  getAllKpis,
} from "@/lib/kpi-registry"
import { useKpiSelection } from "@/lib/hooks/use-kpi-selection"
import { Settings2, Check, RotateCcw } from "lucide-react"

interface KpiSelectorProps {
  variant?: "org" | "super"
  maxKpis?: number
  className?: string
}

export function KpiSelector({
  variant = "org",
  maxKpis = 6,
  className,
}: KpiSelectorProps) {
  const [open, setOpen] = useState(false)
  const { selectedKpis, toggleKpi, resetToDefaults, isSelected, canAddMore } =
    useKpiSelection(variant, maxKpis)

  const availableKpis = variant === "org" ? getOrgAvailableKpis() : getAllKpis()

  // Group KPIs by category
  const kpisByCategory = availableKpis.reduce(
    (acc, kpiId) => {
      const category = KPI_REGISTRY[kpiId].category
      if (!acc[category]) acc[category] = []
      acc[category].push(kpiId)
      return acc
    },
    {} as Record<KpiCategory, KpiId[]>
  )

  const categoryLabels: Record<KpiCategory, string> = {
    expense: "Expenses",
    inventory: "Inventory",
    super: "Cross-Org",
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5", className)}
        >
          <Settings2 className="size-4" />
          Customize KPIs
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Select KPIs</div>
              <div className="text-xs text-muted-foreground">
                {selectedKpis.length}/{maxKpis} selected
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {(Object.entries(kpisByCategory) as [KpiCategory, KpiId[]][]).map(
            ([category, kpis]) => (
              <div key={category} className="mb-3 last:mb-0">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-1">
                  {categoryLabels[category]}
                </div>
                <div className="space-y-0.5">
                  {kpis.map((kpiId) => {
                    const def = KPI_REGISTRY[kpiId]
                    const selected = isSelected(kpiId)
                    const disabled = !selected && !canAddMore

                    return (
                      <button
                        key={kpiId}
                        onClick={() => toggleKpi(kpiId)}
                        disabled={disabled}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                          selected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span>{def.label}</span>
                        {selected && <Check className="size-4" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
