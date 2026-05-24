"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "naijastocks:dashboard-sidebar-collapsed";

export const EXPANDED_SIDEBAR_WIDTH = 272;
export const COLLAPSED_SIDEBAR_WIDTH = 80;

type DashboardSidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  sidebarWidth: number;
};

const DashboardSidebarContext = createContext<DashboardSidebarContextValue | null>(null);

export function DashboardSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const persistCollapsed = useCallback(
    (value: boolean) => {
      if (!hydrated) return;
      try {
        localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
      } catch {
        // ignore
      }
    },
    [hydrated]
  );

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value);
      persistCollapsed(value);
    },
    [persistCollapsed]
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  }, [persistCollapsed]);

  const sidebarWidth = collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      sidebarWidth,
    }),
    [collapsed, setCollapsed, toggleCollapsed, sidebarWidth]
  );

  return (
    <DashboardSidebarContext.Provider value={value}>{children}</DashboardSidebarContext.Provider>
  );
}

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggleCollapsed: () => {},
      sidebarWidth: EXPANDED_SIDEBAR_WIDTH,
    };
  }
  return context;
}