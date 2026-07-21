import { api } from "@/lib/api/client";
import type { VehicleResponse } from "@/types/vehicles";

export function listVehicles() {
  return api.get<VehicleResponse[]>("/vehicles").then((res) => res.data);
}
