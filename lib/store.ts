import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  jpNames: boolean;
  theme: "light" | "dark";
  sidebarOpen: boolean;
  toggleJpNames: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setJpNames: (value: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      jpNames: false,
      theme: "dark",
      sidebarOpen: true,
      toggleJpNames: () => set((state) => ({ jpNames: !state.jpNames })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setJpNames: (value) => set({ jpNames: value }),
    }),
    { name: "miximax-settings" },
  ),
);
