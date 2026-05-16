"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type AppSearchContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

const AppSearchContext = createContext<AppSearchContextValue | null>(null);

export function headerSearchActivePath(pathname: string) {
  return (
    pathname === "/orders" ||
    pathname === "/inventory" ||
    pathname === "/customers"
  );
}

export function AppSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery("");
  }, [pathname]);

  const value = useMemo(
    () => ({ searchQuery, setSearchQuery }),
    [searchQuery],
  );

  return (
    <AppSearchContext.Provider value={value}>
      {children}
    </AppSearchContext.Provider>
  );
}

export function useAppSearch() {
  const ctx = useContext(AppSearchContext);
  if (!ctx) {
    throw new Error("useAppSearch must be used within AppSearchProvider");
  }
  return ctx;
}
