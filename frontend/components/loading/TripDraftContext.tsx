"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface TripDraftState {
  orderIds: string[];
  vehicleId: string | null;
  driverId: string | null;
  remark: string;
}

interface TripDraftContextValue extends TripDraftState {
  toggleOrder: (orderId: string) => void;
  setOrderIds: (ids: string[]) => void;
  setVehicle: (vehicleId: string) => void;
  setDriver: (driverId: string) => void;
  setRemark: (remark: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "dms_loading_trip_draft";
const EMPTY_STATE: TripDraftState = { orderIds: [], vehicleId: null, driverId: null, remark: "" };

const TripDraftContext = createContext<TripDraftContextValue | null>(null);

// Selection state shared across Orders -> Assign Vehicle -> Create Trip,
// same sessionStorage-backed pattern as components/salesman/CartContext.tsx
// (there's no server-side "trip draft" concept - a trip is only created,
// atomically, once the supervisor confirms on the Create Trip screen).
function readStoredState(): TripDraftState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function TripDraftProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TripDraftState>(readStoredState);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const toggleOrder = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      orderIds: prev.orderIds.includes(orderId)
        ? prev.orderIds.filter((id) => id !== orderId)
        : [...prev.orderIds, orderId],
    }));
  }, []);

  const setOrderIds = useCallback((ids: string[]) => {
    setState((prev) => ({ ...prev, orderIds: ids }));
  }, []);

  const setVehicle = useCallback((vehicleId: string) => {
    setState((prev) => ({ ...prev, vehicleId }));
  }, []);

  const setDriver = useCallback((driverId: string) => {
    setState((prev) => ({ ...prev, driverId }));
  }, []);

  const setRemark = useCallback((remark: string) => {
    setState((prev) => ({ ...prev, remark }));
  }, []);

  const clear = useCallback(() => {
    setState(EMPTY_STATE);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <TripDraftContext.Provider
      value={{ ...state, toggleOrder, setOrderIds, setVehicle, setDriver, setRemark, clear }}
    >
      {children}
    </TripDraftContext.Provider>
  );
}

export function useTripDraft(): TripDraftContextValue {
  const ctx = useContext(TripDraftContext);
  if (!ctx) throw new Error("useTripDraft must be used within TripDraftProvider");
  return ctx;
}
