import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface AdminOrgState {
  selectedOrgId: string
  _hasHydrated: boolean
}

interface AdminOrgActions {
  selectOrg: (orgId: string) => void
  clearOrg: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAdminOrgStore = create<AdminOrgState & AdminOrgActions>()(
  persist(
    (set) => ({
      selectedOrgId: "",
      _hasHydrated: false,
      selectOrg: (orgId) => set({ selectedOrgId: orgId }),
      clearOrg: () => set({ selectedOrgId: "" }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "admin-last-org-id",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedOrgId: state.selectedOrgId }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
