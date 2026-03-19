"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  notificationsPanelOpen: boolean;
  searchOpen: boolean;
  theme: Theme;
  collapsedSections: Record<string, boolean>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleSection: (label: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      notificationsPanelOpen: false,
      searchOpen: false,
      theme: "dark" as Theme,
      collapsedSections: {} as Record<string, boolean>,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleMobileSidebar: () =>
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
      setMobileSidebarOpen: (open) => set({ sidebarMobileOpen: open }),
      setNotificationsPanelOpen: (open) =>
        set({ notificationsPanelOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setTheme: (theme) => set({ theme }),
      toggleSection: (label: string) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [label]: !state.collapsedSections[label],
          },
        })),
    }),
    {
      name: "scalingflow-ui-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        collapsedSections: state.collapsedSections,
      }),
    },
  ),
);
