import { api } from "@/lib/api/client";
import type {
  VehicleCreate,
  VehicleDeleteResponse,
  VehicleResponse,
  VehicleStatus,
} from "@/types/vehicles";

export function listVehicles() {
  return api.get<VehicleResponse[]>("/vehicles").then((res) => res.data);
}

export function createVehicle(data: VehicleCreate) {
  return api.post<VehicleResponse>("/vehicles", data).then((res) => res.data);
}

export function assignVehicleDriver(vehicleId: string, driverId: string) {
  return api
    .patch<VehicleResponse>(`/vehicles/${vehicleId}/driver`, { driver_id: driverId })
    .then((res) => res.data);
}

export function setVehicleStatus(vehicleId: string, status: VehicleStatus) {
  return api
    .patch<VehicleResponse>(`/vehicles/${vehicleId}/status`, { status })
    .then((res) => res.data);
}

export function deleteVehicle(vehicleId: string) {
  return api.delete<VehicleDeleteResponse>(`/vehicles/${vehicleId}`).then((res) => res.data);
}
