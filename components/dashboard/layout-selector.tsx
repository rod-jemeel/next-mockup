"use client"

import { cn } from "@/lib/utils"
import { LayoutPreset, LAYOUT_PRESETS, getLayoutSlotCounts } from "@/lib/layout-presets"
import { Check } from "lucide-react"

interface LayoutSelectorProps {
  value: LayoutPreset
  onChange: (layout: LayoutPreset) => void
  disabled?: boolean
}

export function LayoutSelector({ value, onChange, disabled }: LayoutSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(Object.entries(LAYOUT_PRESETS) as [LayoutPreset, typeof LAYOUT_PRESETS["balanced"]][]).map(
        ([preset, config]) => {
          const isSelected = value === preset
          const { kpiCount, chartCount } = getLayoutSlotCounts(preset)

          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
                  <Check className="size-2.5 text-primary-foreground" />
                </div>
              )}

              {/* Visual preview */}
              <LayoutPreview preset={preset} />

              {/* Label and description */}
              <div className="space-y-0.5">
                <div className="text-xs font-medium">{config.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {kpiCount} KPIs, {chartCount} {chartCount === 1 ? "chart" : "charts"}
                </div>
              </div>
            </button>
          )
        }
      )}
    </div>
  )
}

interface LayoutPreviewProps {
  preset: LayoutPreset
}

function LayoutPreview({ preset }: LayoutPreviewProps) {
  const config = LAYOUT_PRESETS[preset]

  // Get KPI and chart slots
  const kpiSlots = config.slots.filter((s) => s.type === "kpi")
  const chartSlots = config.slots.filter((s) => s.type === "chart")

  return (
    <div className="flex w-full flex-col gap-1">
      {/* KPI row(s) */}
      {kpiSlots.length > 0 && (
        <div className="flex gap-1">
          {kpiSlots.map((slot) => (
            <div
              key={slot.id}
              className="h-2 flex-1 rounded-[2px] bg-primary/30"
            />
          ))}
        </div>
      )}

      {/* Chart row(s) */}
      {chartSlots.length > 0 && (
        <div className="flex gap-1">
          {chartSlots.map((slot) => {
            // Size determines width
            const widthClass =
              slot.size === "full"
                ? "w-full"
                : slot.size === "lg"
                  ? "flex-1"
                  : slot.size === "md"
                    ? "flex-1"
                    : "flex-1"

            return (
              <div
                key={slot.id}
                className={cn(
                  "h-4 rounded-[2px] bg-muted-foreground/30",
                  widthClass
                )}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
