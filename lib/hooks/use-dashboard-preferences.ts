"use client"

import useSWR from "swr"
import { useState, useCallback } from "react"
import {
  DashboardPreferences,
  LayoutPreset,
  LayoutConfig,
  LayoutSlot,
  getDefaultPreferences,
  getDefaultWidgetAssignments,
} from "@/lib/layout-presets"

interface LayoutOption {
  id: LayoutPreset
  label: string
  description: string
  slots: LayoutSlot[]
}

interface PreferencesResponse {
  preferences: DashboardPreferences
  isDefault: boolean
  availableLayouts: LayoutOption[]
}

interface ApiResponse {
  data: PreferencesResponse
}

interface MutationResponse {
  data: {
    preferences: DashboardPreferences
    wasReset?: boolean
  }
}

const fetcher = async (url: string): Promise<PreferencesResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to fetch preferences")
  }
  const json: ApiResponse = await res.json()
  return json.data
}

/**
 * Hook for managing dashboard preferences
 *
 * @param orgId - Organization ID
 * @param variant - Dashboard variant (org or super)
 */
export function useDashboardPreferences(
  orgId: string | null,
  variant: "org" | "super" = "org"
) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    data,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR<PreferencesResponse>(
    orgId ? `/api/orgs/${orgId}/dashboard-preferences` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  )

  // Get preferences with fallback to defaults
  const preferences = data?.preferences ?? getDefaultPreferences(variant)
  const isDefault = data?.isDefault ?? true
  const availableLayouts = data?.availableLayouts ?? []

  /**
   * Update layout preset
   */
  const setLayout = useCallback(
    async (layout: LayoutPreset) => {
      if (!orgId) return

      setIsSaving(true)
      setSaveError(null)

      try {
        // Get new default widget assignments for the layout
        const newWidgets = getDefaultWidgetAssignments(layout, variant)

        const res = await fetch(`/api/orgs/${orgId}/dashboard-preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overview: {
              layout,
              widgets: newWidgets,
            },
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error?.message || "Failed to update layout")
        }

        const json: MutationResponse = await res.json()

        // Update local cache
        await mutate(
          {
            preferences: json.data.preferences,
            isDefault: false,
            availableLayouts,
          },
          { revalidate: false }
        )
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to update")
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [orgId, variant, availableLayouts, mutate]
  )

  /**
   * Update a specific widget assignment
   */
  const setWidget = useCallback(
    async (slotId: string, widgetId: string) => {
      if (!orgId) return

      setIsSaving(true)
      setSaveError(null)

      try {
        const res = await fetch(`/api/orgs/${orgId}/dashboard-preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overview: {
              widgets: { [slotId]: widgetId },
            },
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error?.message || "Failed to update widget")
        }

        const json: MutationResponse = await res.json()

        // Update local cache
        await mutate(
          {
            preferences: json.data.preferences,
            isDefault: false,
            availableLayouts,
          },
          { revalidate: false }
        )
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to update")
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [orgId, availableLayouts, mutate]
  )

  /**
   * Update all preferences at once
   */
  const savePreferences = useCallback(
    async (newPrefs: DashboardPreferences) => {
      if (!orgId) return

      setIsSaving(true)
      setSaveError(null)

      try {
        const res = await fetch(`/api/orgs/${orgId}/dashboard-preferences`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPrefs),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error?.message || "Failed to save preferences")
        }

        const json: MutationResponse = await res.json()

        // Update local cache
        await mutate(
          {
            preferences: json.data.preferences,
            isDefault: false,
            availableLayouts,
          },
          { revalidate: false }
        )
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save")
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [orgId, availableLayouts, mutate]
  )

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async () => {
    if (!orgId) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/orgs/${orgId}/dashboard-preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || "Failed to reset preferences")
      }

      const json: MutationResponse = await res.json()

      // Update local cache
      await mutate(
        {
          preferences: json.data.preferences,
          isDefault: true,
          availableLayouts,
        },
        { revalidate: false }
      )
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to reset")
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [orgId, availableLayouts, mutate])

  return {
    // Data
    preferences,
    isDefault,
    availableLayouts,

    // Loading states
    isLoading,
    isSaving,

    // Errors
    fetchError: fetchError?.message ?? null,
    saveError,

    // Mutations
    setLayout,
    setWidget,
    savePreferences,
    resetPreferences,

    // SWR utilities
    refresh: () => mutate(),
  }
}
