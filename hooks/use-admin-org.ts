"use client"

import { useAdminOrgStore } from "@/lib/stores/admin-org-store"

/**
 * Hook for managing selected organization in Admin Hub.
 * Thin wrapper around Zustand store for backwards compatibility.
 */
export function useAdminOrg() {
  const selectedOrgId = useAdminOrgStore((s) => s.selectedOrgId)
  const selectOrg = useAdminOrgStore((s) => s.selectOrg)
  const clearOrg = useAdminOrgStore((s) => s.clearOrg)
  const isLoaded = useAdminOrgStore((s) => s._hasHydrated)

  return {
    selectedOrgId,
    selectOrg,
    clearOrg,
    isLoaded,
    hasSelection: Boolean(selectedOrgId),
  }
}
