"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "dms_salesman_customer_id";

interface SelectedCustomerContextValue {
  customerId: string | null;
  setCustomerId: (customerId: string | null) => void;
}

const SelectedCustomerContext = createContext<SelectedCustomerContextValue | null>(null);

// Which customer the salesman is currently placing an order for - picked on
// the products screen (see CustomerSelect), then carried through to the
// cart so "place order" knows whose account to bill it to. Kept in
// sessionStorage (not the cart's localStorage) so it resets between logins
// on a shared device but survives a page refresh mid-order.
export function SelectedCustomerProvider({ children }: { children: React.ReactNode }) {
  const [customerId, setCustomerIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from sessionStorage on mount
    setCustomerIdState(window.sessionStorage.getItem(STORAGE_KEY));
    setIsHydrated(true);
  }, []);

  function setCustomerId(next: string | null) {
    setCustomerIdState(next);
    if (!isHydrated) return;
    if (next) window.sessionStorage.setItem(STORAGE_KEY, next);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <SelectedCustomerContext.Provider value={{ customerId, setCustomerId }}>
      {children}
    </SelectedCustomerContext.Provider>
  );
}

export function useSelectedCustomer(): SelectedCustomerContextValue {
  const ctx = useContext(SelectedCustomerContext);
  if (!ctx) throw new Error("useSelectedCustomer must be used within a SelectedCustomerProvider");
  return ctx;
}
