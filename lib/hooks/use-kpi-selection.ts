"use client"

import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import { KpiId, DEFAULT_ORG_KPIS, DEFAULT_SUPER_KPIS, KPI_REGISTRY } from "@/lib/kpi-registry"

// Parse comma-separated KPI IDs from URL
const kpiParser = parseAsArrayOf(parseAsString, ",")

export function useKpiSelection(
  variant: "org" | "super" = "org",
  maxKpis: number = 6
) {
  const defaultKpis = variant === "org" ? DEFAULT_ORG_KPIS : DEFAULT_SUPER_KPIS

  const [selectedKpis, setSelectedKpis] = useQueryState(
    "kpis",
    kpiParser.withDefault(defaultKpis as string[])
  )

  // Validate and filter to only valid KPI IDs
  const validatedKpis = selectedKpis.filter(
    (kpi): kpi is KpiId => kpi in KPI_REGISTRY
  ) as KpiId[]

  // If no valid KPIs, fall back to defaults
  const finalKpis = validatedKpis.length > 0 ? validatedKpis : defaultKpis

  const toggleKpi = (kpiId: KpiId) => {
    if (finalKpis.includes(kpiId)) {
      // Remove KPI (but keep at least 1)
      if (finalKpis.length > 1) {
        setSelectedKpis(finalKpis.filter((id) => id !== kpiId))
      }
    } else {
      // Add KPI (up to max)
      if (finalKpis.length < maxKpis) {
        setSelectedKpis([...finalKpis, kpiId])
      }
    }
  }

  const setKpis = (kpis: KpiId[]) => {
    // Ensure at least 1 KPI and at most maxKpis
    const limited = kpis.slice(0, maxKpis)
    if (limited.length > 0) {
      setSelectedKpis(limited)
    }
  }

  const resetToDefaults = () => {
    setSelectedKpis(defaultKpis as string[])
  }

  return {
    selectedKpis: finalKpis,
    toggleKpi,
    setKpis,
    resetToDefaults,
    maxKpis,
    isSelected: (kpiId: KpiId) => finalKpis.includes(kpiId),
    canAddMore: finalKpis.length < maxKpis,
  }
}
