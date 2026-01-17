/**
 * Dashboard Preferences Service
 *
 * Server-side CRUD operations for dashboard preferences.
 * Preferences are stored in organization.metadata.dashboardPreferences
 */

import { cache } from "react"
import { supabase } from "@/lib/server/db"
import { ApiError } from "@/lib/errors"
import {
  DashboardPreferences,
  getDefaultPreferences,
  validatePreferences,
} from "@/lib/layout-presets"

interface OrganizationMetadata {
  dashboardPreferences?: DashboardPreferences
  [key: string]: unknown
}

/**
 * Get dashboard preferences for an organization
 * Returns validated preferences or defaults if none exist
 */
export const getDashboardPreferences = cache(async function getDashboardPreferences(
  orgId: string,
  variant: "org" | "super" = "org"
): Promise<{
  preferences: DashboardPreferences
  isDefault: boolean
}> {
  const { data: org, error } = await supabase
    .from("organization")
    .select("metadata")
    .eq("id", orgId)
    .single()

  if (error) {
    console.error("Failed to fetch organization:", error)
    throw new ApiError("DATABASE_ERROR", "Failed to load organization")
  }

  if (!org) {
    throw new ApiError("ORG_NOT_FOUND", "Organization not found")
  }

  // Parse metadata - it's stored as a JSON string in a text column
  let metadata: OrganizationMetadata | null = null
  if (org.metadata) {
    try {
      metadata = typeof org.metadata === "string"
        ? JSON.parse(org.metadata)
        : org.metadata as OrganizationMetadata
    } catch {
      console.warn("Failed to parse organization metadata:", org.metadata)
    }
  }
  const storedPrefs = metadata?.dashboardPreferences

  // Validate stored preferences
  const validatedPrefs = validatePreferences(storedPrefs, variant)

  if (validatedPrefs) {
    return {
      preferences: validatedPrefs,
      isDefault: false,
    }
  }

  // Return defaults if no valid preferences found
  return {
    preferences: getDefaultPreferences(variant),
    isDefault: true,
  }
})

/**
 * Update dashboard preferences for an organization
 * Merges new preferences with existing metadata
 */
export async function updateDashboardPreferences(
  orgId: string,
  preferences: DashboardPreferences
): Promise<DashboardPreferences> {
  // First get existing metadata to preserve other fields
  const { data: org, error: fetchError } = await supabase
    .from("organization")
    .select("metadata")
    .eq("id", orgId)
    .single()

  if (fetchError) {
    console.error("Failed to fetch organization:", fetchError)
    throw new ApiError("DATABASE_ERROR", "Failed to load organization")
  }

  if (!org) {
    throw new ApiError("ORG_NOT_FOUND", "Organization not found")
  }

  // Parse existing metadata - it's stored as a JSON string in a text column
  let existingMetadata: OrganizationMetadata = {}
  if (org.metadata) {
    try {
      existingMetadata = typeof org.metadata === "string"
        ? JSON.parse(org.metadata)
        : org.metadata as OrganizationMetadata
    } catch {
      console.warn("Failed to parse organization metadata:", org.metadata)
    }
  }

  // Merge with existing metadata
  const updatedMetadata: OrganizationMetadata = {
    ...existingMetadata,
    dashboardPreferences: preferences,
  }

  // Update the organization - stringify for text column
  const { error: updateError } = await supabase
    .from("organization")
    .update({ metadata: JSON.stringify(updatedMetadata) })
    .eq("id", orgId)

  if (updateError) {
    console.error("Failed to update organization:", updateError)
    throw new ApiError("DATABASE_ERROR", "Failed to save preferences")
  }

  return preferences
}

/**
 * Reset dashboard preferences to defaults for an organization
 */
export async function resetDashboardPreferences(
  orgId: string,
  variant: "org" | "super" = "org"
): Promise<DashboardPreferences> {
  const defaultPrefs = getDefaultPreferences(variant)
  return updateDashboardPreferences(orgId, defaultPrefs)
}

/**
 * Partial update of dashboard preferences
 * Useful for updating just the layout or just some widgets
 */
export async function patchDashboardPreferences(
  orgId: string,
  patch: Partial<DashboardPreferences["overview"]>,
  variant: "org" | "super" = "org"
): Promise<DashboardPreferences> {
  // Get current preferences
  const { preferences: currentPrefs } = await getDashboardPreferences(orgId, variant)

  // Apply patch
  const updatedPrefs: DashboardPreferences = {
    version: 1,
    overview: {
      ...currentPrefs.overview,
      ...patch,
      widgets: {
        ...currentPrefs.overview.widgets,
        ...(patch.widgets || {}),
      },
    },
  }

  return updateDashboardPreferences(orgId, updatedPrefs)
}
