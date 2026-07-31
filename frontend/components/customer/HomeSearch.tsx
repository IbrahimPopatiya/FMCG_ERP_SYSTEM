"use client";

import { createContext, useContext, useRef } from "react";
import { SearchIcon } from "@/components/customer/icons";

// Lets the layout's top-bar search button open the home page search field
// without the layout needing to know about home's local input state.
const HomeSearchContext = createContext<{
  register: (open: () => void) => () => void;
  open: () => void;
} | null>(null);

export function HomeSearchProvider({ children }: { children: React.ReactNode }) {
  const openRef = useRef<(() => void) | null>(null);

  return (
    <HomeSearchContext.Provider
      value={{
        register: (open) => {
          openRef.current = open;
          return () => {
            if (openRef.current === open) openRef.current = null;
          };
        },
        open: () => openRef.current?.(),
      }}
    >
      {children}
    </HomeSearchContext.Provider>
  );
}

export function useHomeSearch() {
  const ctx = useContext(HomeSearchContext);
  if (!ctx) throw new Error("useHomeSearch must be used within HomeSearchProvider");
  return ctx;
}

export function HomeSearchButton() {
  const { open } = useHomeSearch();
  return (
    <button
      type="button"
      aria-label="Search"
      onClick={open}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary hover:brightness-95"
    >
      <SearchIcon className="h-4 w-4" />
    </button>
  );
}
