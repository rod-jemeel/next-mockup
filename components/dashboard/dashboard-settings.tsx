"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LayoutSelector } from "./layout-selector"
import { useDashboardPreferences } from "@/lib/hooks/use-dashboard-preferences"
import {
  DashboardPreferences,
  LayoutPreset,
  LAYOUT_PRESETS,
  getLayoutSlots,
} from "@/lib/layout-presets"
import {
  KPI_WIDGETS,
  CHART_WIDGETS,
  KpiWidgetId,
  ChartWidgetId,
  getOrgAvailableKpis,
  getOrgAvailableCharts,
  getAllKpis,
  getAllCharts,
} from "@/lib/widget-registry"
import { Settings2, RotateCcw, Loader2 } from "lucide-react"

interface DashboardSettingsProps {
  orgId: string
  variant?: "org" | "super"
}

export function DashboardSettings({ orgId, variant = "org" }: DashboardSettingsProps) {
  const [open, setOpen] = useState(false)

  const {
    preferences,
    isDefault,
    isLoading,
    isSaving,
    saveError,
    savePreferences,
    resetPreferences,
  } = useDashboardPreferences(orgId, variant)

  // Local state for editing
  const [editedPrefs, setEditedPrefs] = useState<DashboardPreferences | null>(null)

  // Sync local state when preferences load or sheet opens
  useEffect(() => {
    if (open && preferences) {
      setEditedPrefs(preferences)
    }
  }, [open, preferences])

  const handleLayoutChange = (layout: LayoutPreset) => {
    if (!editedPrefs) return

    // Get current layout's slots
    const currentSlots = getLayoutSlots(editedPrefs.overview.layout)
    const newSlots = getLayoutSlots(layout)

    // Build new widget assignments, preserving what we can
    const newWidgets: Record<string, string> = {}
    const availableKpis = variant === "org" ? getOrgAvailableKpis() : getAllKpis()
    const availableCharts = variant === "org" ? getOrgAvailableCharts() : getAllCharts()

    // Try to carry over existing widgets where possible (combined into single loop)
    const existingKpiWidgets: string[] = []
    const existingChartWidgets: string[] = []

    for (const slot of currentSlots) {
      const widget = editedPrefs.overview.widgets[slot.id]
      if (widget) {
        if (slot.type === "kpi") {
          existingKpiWidgets.push(widget)
        } else if (slot.type === "chart") {
          existingChartWidgets.push(widget)
        }
      }
    }

    let kpiIndex = 0
    let chartIndex = 0

    for (const slot of newSlots) {
      if (slot.type === "kpi") {
        // Use existing or fallback to available
        newWidgets[slot.id] =
          existingKpiWidgets[kpiIndex] ||
          availableKpis[kpiIndex % availableKpis.length]
        kpiIndex++
      } else {
        // Use existing or fallback to available
        newWidgets[slot.id] =
          existingChartWidgets[chartIndex] ||
          availableCharts[chartIndex % availableCharts.length]
        chartIndex++
      }
    }

    setEditedPrefs({
      version: 1,
      overview: {
        layout,
        widgets: newWidgets,
      },
    })
  }

  const handleWidgetChange = (slotId: string, widgetId: string) => {
    if (!editedPrefs) return

    setEditedPrefs({
      ...editedPrefs,
      overview: {
        ...editedPrefs.overview,
        widgets: {
          ...editedPrefs.overview.widgets,
          [slotId]: widgetId,
        },
      },
    })
  }

  const handleSave = async () => {
    if (!editedPrefs) return

    try {
      await savePreferences(editedPrefs)
      setOpen(false)
    } catch {
      // Error is handled by the hook
    }
  }

  const handleReset = async () => {
    try {
      await resetPreferences()
      // Close sheet after reset
      setOpen(false)
    } catch {
      // Error is handled by the hook
    }
  }

  const handleCancel = () => {
    setEditedPrefs(preferences)
    setOpen(false)
  }

  // Get available widgets based on variant
  const availableKpis = variant === "org" ? getOrgAvailableKpis() : getAllKpis()
  const availableCharts = variant === "org" ? getOrgAvailableCharts() : getAllCharts()

  // Get current layout slots
  const currentLayout = editedPrefs?.overview.layout ?? "balanced"
  const kpiSlots = getLayoutSlots(currentLayout, "kpi")
  const chartSlots = getLayoutSlots(currentLayout, "chart")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="size-4" />
          Customize
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col overflow-hidden sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-sm">Dashboard Settings</SheetTitle>
          <SheetDescription className="text-xs">
            Customize your dashboard layout and widgets
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            {/* Layout Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Layout Preset</label>
                {!isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isSaving}
                    className="h-6 gap-1 px-2 text-xs"
                  >
                    <RotateCcw className="size-3" />
                    Reset
                  </Button>
                )}
              </div>
              <LayoutSelector
                value={currentLayout}
                onChange={handleLayoutChange}
                disabled={isSaving}
              />
            </div>

            <Separator />

            {/* KPI Widget Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium">KPI Widgets</label>
              <div className="space-y-2">
                {kpiSlots.map((slot, index) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <span className="w-16 text-xs text-muted-foreground">
                      Slot {index + 1}
                    </span>
                    <Select
                      value={editedPrefs?.overview.widgets[slot.id] ?? ""}
                      onValueChange={(value) => value && handleWidgetChange(slot.id, value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select KPI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Expenses</SelectLabel>
                          {availableKpis
                            .filter((id) => KPI_WIDGETS[id].category === "expense")
                            .map((id) => (
                              <SelectItem key={id} value={id}>
                                {KPI_WIDGETS[id].label}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Inventory</SelectLabel>
                          {availableKpis
                            .filter((id) => KPI_WIDGETS[id].category === "inventory")
                            .map((id) => (
                              <SelectItem key={id} value={id}>
                                {KPI_WIDGETS[id].label}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        {variant === "super" && (
                          <SelectGroup>
                            <SelectLabel>Cross-Org</SelectLabel>
                            {availableKpis
                              .filter((id) => KPI_WIDGETS[id].category === "super")
                              .map((id) => (
                                <SelectItem key={id} value={id}>
                                  {KPI_WIDGETS[id].label}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Chart Widget Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Chart Widgets</label>
              <div className="space-y-2">
                {chartSlots.map((slot, index) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <span className="w-16 text-xs text-muted-foreground">
                      Slot {index + 1}
                    </span>
                    <Select
                      value={editedPrefs?.overview.widgets[slot.id] ?? ""}
                      onValueChange={(value) => value && handleWidgetChange(slot.id, value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select chart" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Expenses</SelectLabel>
                          {availableCharts
                            .filter((id) => CHART_WIDGETS[id].category === "expense")
                            .map((id) => (
                              <SelectItem key={id} value={id}>
                                {CHART_WIDGETS[id].label}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Inventory</SelectLabel>
                          {availableCharts
                            .filter((id) => CHART_WIDGETS[id].category === "inventory")
                            .map((id) => (
                              <SelectItem key={id} value={id}>
                                {CHART_WIDGETS[id].label}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        {variant === "super" && (
                          <SelectGroup>
                            <SelectLabel>Cross-Org</SelectLabel>
                            {availableCharts
                              .filter((id) => CHART_WIDGETS[id].category === "super")
                              .map((id) => (
                                <SelectItem key={id} value={id}>
                                  {CHART_WIDGETS[id].label}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
          </div>
        )}

        <SheetFooter className="flex-row gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
