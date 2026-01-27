import { create } from "zustand"

type DialogType = "edit" | "delete"

interface DialogState {
  type: DialogType | null
  entityType: string | null
  entity: unknown
}

interface DialogActions {
  openDialog: (type: DialogType, entityType: string, entity: unknown) => void
  closeDialog: () => void
}

export const useDialogStore = create<DialogState & DialogActions>()((set) => ({
  type: null,
  entityType: null,
  entity: null,

  openDialog: (type, entityType, entity) =>
    set({ type, entityType, entity }),

  closeDialog: () =>
    set({ type: null, entityType: null, entity: null }),
}))

/**
 * Type-safe hook for entity dialogs in super admin content clients.
 * Returns editing/deleting entity and open/close handlers.
 */
export function useEntityDialog<T>(entityType: string) {
  const type = useDialogStore((s) => s.type)
  const storeEntityType = useDialogStore((s) => s.entityType)
  const entity = useDialogStore((s) => s.entity)
  const openDialog = useDialogStore((s) => s.openDialog)
  const closeDialog = useDialogStore((s) => s.closeDialog)

  const isMatch = storeEntityType === entityType
  const editingEntity = (isMatch && type === "edit" ? entity : null) as T | null
  const deletingEntity = (isMatch && type === "delete" ? entity : null) as T | null

  return {
    editingEntity,
    deletingEntity,
    openEdit: (e: T) => openDialog("edit", entityType, e),
    openDelete: (e: T) => openDialog("delete", entityType, e),
    closeDialog,
    onEditOpenChange: (open: boolean) => { if (!open) closeDialog() },
    onDeleteOpenChange: (open: boolean) => { if (!open) closeDialog() },
  }
}
