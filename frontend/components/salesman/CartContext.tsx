"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProductCatalogResponse } from "@/types/product";

export interface CartLine {
  product: ProductCatalogResponse;
  qty: number;
}

interface CartState {
  customerId: string | null;
  lines: CartLine[];
  remarks: string;
  expectedDelivery: string;
}

interface CartContextValue extends CartState {
  setCustomer: (customerId: string) => void;
  addItem: (product: ProductCatalogResponse) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setRemarks: (remarks: string) => void;
  setExpectedDelivery: (date: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  estimatedGst: number;
  estimatedTotal: number;
}

const STORAGE_KEY = "dms_salesman_cart";

const EMPTY_STATE: CartState = { customerId: null, lines: [], remarks: "", expectedDelivery: "" };

const CartContext = createContext<CartContextValue | null>(null);

// Order-taking cart, scoped to one customer at a time. Kept client-side only
// — SalesOrderCreate is a single-shot POST, there's no server-side draft
// order concept, so this context (backed by sessionStorage so a reload
// mid-flow doesn't lose it) is the only place cart state lives between the
// Take Order, Cart and Order Summary screens.
function readStoredState(): CartState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(readStoredState);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setCustomer = useCallback((customerId: string) => {
    setState((prev) =>
      prev.customerId === customerId ? prev : { ...EMPTY_STATE, customerId }
    );
  }, []);

  const addItem = useCallback((product: ProductCatalogResponse) => {
    setState((prev) => {
      const existing = prev.lines.find((l) => l.product.id === product.id);
      if (existing) {
        return {
          ...prev,
          lines: prev.lines.map((l) =>
            l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
          ),
        };
      }
      return { ...prev, lines: [...prev.lines, { product, qty: 1 }] };
    });
  }, []);

  const incrementItem = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.product.id === productId ? { ...l, qty: l.qty + 1 } : l)),
    }));
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, lines: prev.lines.filter((l) => l.product.id !== productId) }));
  }, []);

  const setRemarks = useCallback((remarks: string) => {
    setState((prev) => ({ ...prev, remarks }));
  }, []);

  const setExpectedDelivery = useCallback((expectedDelivery: string) => {
    setState((prev) => ({ ...prev, expectedDelivery }));
  }, []);

  const clearCart = useCallback(() => {
    setState(EMPTY_STATE);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const { itemCount, subtotal, estimatedGst, estimatedTotal } = useMemo(() => {
    const subtotal = state.lines.reduce((sum, l) => sum + l.product.effective_price * l.qty, 0);
    const estimatedGst = state.lines.reduce(
      (sum, l) => sum + (l.product.effective_price * l.qty * l.product.gst_rate) / 100,
      0
    );
    return {
      itemCount: state.lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal,
      estimatedGst,
      estimatedTotal: subtotal + estimatedGst,
    };
  }, [state.lines]);

  const value: CartContextValue = {
    ...state,
    setCustomer,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    setRemarks,
    setExpectedDelivery,
    clearCart,
    itemCount,
    subtotal,
    estimatedGst,
    estimatedTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
