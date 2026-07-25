import { api } from "@/lib/api/client";
import type { LoadableOrderResponse, TripCreate, TripOrderResponse, TripResponse, TripStatusResponse } from "@/types/trips";

// Decimal fields (lc_value, total_lc) serialize as JSON strings from the
// backend (pydantic Decimal encoding), not numbers - normalize them here,
// once, so every caller can rely on the `number` type the interfaces
// declare instead of re-coercing (or silently doing string concatenation
// via `+`) at every call site.
function normalizeOrder(order: TripOrderResponse): TripOrderResponse {
  return { ...order, lc_value: Number(order.lc_value) };
}

function normalizeTrip(trip: TripResponse): TripResponse {
  return { ...trip, total_lc: Number(trip.total_lc), orders: trip.orders.map(normalizeOrder) };
}

function normalizeLoadable(order: LoadableOrderResponse): LoadableOrderResponse {
  return { ...order, lc_value: Number(order.lc_value) };
}

export function listLoadableOrders() {
  return api.get<LoadableOrderResponse[]>("/trips/loadable-orders").then((res) => res.data.map(normalizeLoadable));
}

export function listTrips() {
  return api.get<TripResponse[]>("/trips").then((res) => res.data.map(normalizeTrip));
}

export function getTrip(tripId: string) {
  return api.get<TripResponse>(`/trips/${tripId}`).then((res) => normalizeTrip(res.data));
}

export function createTrip(data: TripCreate) {
  return api.post<TripResponse>("/trips", data).then((res) => normalizeTrip(res.data));
}

export function startTrip(tripId: string) {
  return api.post<TripStatusResponse>(`/trips/${tripId}/start`).then((res) => res.data);
}

export function completeTrip(tripId: string) {
  return api.post<TripStatusResponse>(`/trips/${tripId}/complete`).then((res) => res.data);
}

export function cancelTrip(tripId: string) {
  return api.post<TripStatusResponse>(`/trips/${tripId}/cancel`).then((res) => res.data);
}
