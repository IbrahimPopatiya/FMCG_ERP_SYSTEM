import { api } from "@/lib/api/client";
import type {
  VehicleCreate,
  VehicleDeleteResponse,
  VehicleResponse,
  VehicleStatus,
  VehicleUpdate,
} from "@/types/vehicles";

// `capacity` is a Decimal on the backend and serializes as a JSON string,
// not a number - normalize it here so arithmetic on it (LC gauges in the
// Loading Supervisor module) doesn't silently do string concatenation.
function normalize(vehicle: VehicleResponse): VehicleResponse {
  return { ...vehicle, capacity: Number(vehicle.capacity) };
}

export function listVehicles() {
  return api.get<VehicleResponse[]>("/vehicles").then((res) => res.data.map(normalize));
}

export function createVehicle(data: VehicleCreate) {
  return api.post<VehicleResponse>("/vehicles", data).then((res) => normalize(res.data));
}

export function updateVehicle(vehicleId: string, data: VehicleUpdate) {
  return api.patch<VehicleResponse>(`/vehicles/${vehicleId}`, data).then((res) => normalize(res.data));
}

export function assignVehicleDriver(vehicleId: string, driverId: string) {
  return api
    .patch<VehicleResponse>(`/vehicles/${vehicleId}/driver`, { driver_id: driverId })
    .then((res) => normalize(res.data));
}

export function setVehicleStatus(vehicleId: string, status: VehicleStatus) {
  return api
    .patch<VehicleResponse>(`/vehicles/${vehicleId}/status`, { status })
    .then((res) => normalize(res.data));
}

export function deleteVehicle(vehicleId: string) {
  return api.delete<VehicleDeleteResponse>(`/vehicles/${vehicleId}`).then((res) => res.data);
}
