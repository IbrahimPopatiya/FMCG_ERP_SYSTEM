import { useQuery } from "@tanstack/react-query";
import { getTrip, listLoadableOrders, listTrips } from "@/lib/api/trips";

export function useLoadableOrders() {
  return useQuery({
    queryKey: ["trips", "loadable-orders"],
    queryFn: listLoadableOrders,
  });
}

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: listTrips,
  });
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: ["trips", tripId],
    queryFn: () => getTrip(tripId),
    enabled: !!tripId,
  });
}
