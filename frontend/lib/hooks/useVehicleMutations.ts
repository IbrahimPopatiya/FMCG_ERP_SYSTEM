import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignVehicleDriver,
  createVehicle,
  deleteVehicle,
  setVehicleStatus,
} from "@/lib/api/vehicles";
import type { VehicleCreate, VehicleStatus } from "@/types/vehicles";

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleCreate) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useAssignVehicleDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      assignVehicleDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useSetVehicleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, status }: { vehicleId: string; status: VehicleStatus }) =>
      setVehicleStatus(vehicleId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
