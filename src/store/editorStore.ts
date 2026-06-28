import { create } from "zustand"

type SaveStatus = "saved" | "saving" | "error"

interface EditorState {
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  saveStatus: "saved",
  setSaveStatus: (status) => set({ saveStatus: status }),
}))
