"use client"

import { parseAsString, useQueryState } from "nuqs"

export type DashboardTab = "overview" | "expenses" | "inventory"

const validTabs: DashboardTab[] = ["overview", "expenses", "inventory"]

export function useTabState(defaultTab: DashboardTab = "overview") {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault(defaultTab)
  )

  // Validate the tab value
  const validatedTab = validTabs.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : defaultTab

  return [validatedTab, setTab] as const
}
