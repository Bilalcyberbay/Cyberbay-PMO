import { create } from 'zustand'

interface SidebarState {
  isCollapsed: boolean
  toggleCollapse: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}))
