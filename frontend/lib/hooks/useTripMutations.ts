import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelTrip, completeTrip, createTrip, startTrip } from "@/lib/api/trips";
import type { TripCreate } from "@/types/trips";

function invalidateTrips(queryClient: ReturnType<typeof useQueryClient>, tripId?: string) {
  queryClient.invalidateQueries({ queryKey: ["trips"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  if (tripId) queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TripCreate) => createTrip(data),
    onSuccess: () => invalidateTrips(queryClient),
  });
}

export function useStartTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startTrip(tripId),
    onSuccess: () => invalidateTrips(queryClient, tripId),
  });
}

export function useCompleteTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeTrip(tripId),
    onSuccess: () => invalidateTrips(queryClient, tripId),
  });
}

export function useCancelTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelTrip(tripId),
    onSuccess: () => invalidateTrips(queryClient, tripId),
  });
}
