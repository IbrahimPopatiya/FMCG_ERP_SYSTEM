"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Most of what we fetch (catalog, categories, brands, orders...)
            // doesn't change second-to-second - without this, switching back
            // to the tab (or navigating between screens that share a query)
            // silently re-downloads it every time. Any screen that genuinely
            // needs fresher data can still override staleTime per-hook.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
