"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/types/cart";
import type { ProductCatalogResponse } from "@/types/product";

const STORAGE_KEY = "dms_cart";

interface CartContextValue {
  items: CartItem[];
  totalQty: number;
  subtotal: number;
  getQty: (productId: string) => number;
  addItem: (product: ProductCatalogResponse, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cart starts empty on both server and first client render (so hydration
  // matches), then loads from localStorage right after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from localStorage on mount, not a derived-state loop
    setItems(readStoredCart());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const value = useMemo<CartContextValue>(() => {
    function addItem(product: ProductCatalogResponse, qty = 1) {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            unit: product.unit,
            packing: product.packing,
            price: product.effective_price,
            gstRate: product.gst_rate,
            image: product.image,
            qty,
          },
        ];
      });
    }

    function setQty(productId: string, qty: number) {
      setItems((prev) => {
        if (qty <= 0) return prev.filter((i) => i.productId !== productId);
        return prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
      });
    }

    function removeItem(productId: string) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    }

    function clear() {
      setItems([]);
    }

    function getQty(productId: string) {
      return items.find((i) => i.productId === productId)?.qty ?? 0;
    }

    return {
      items,
      totalQty: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.qty * i.price, 0),
      getQty,
      addItem,
      setQty,
      removeItem,
      clear,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
