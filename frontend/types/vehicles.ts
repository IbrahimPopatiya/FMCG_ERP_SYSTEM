export type VehicleStatus = "available" | "in_use" | "maintenance";

export interface VehicleResponse {
  id: string;
  vehicle_number: string;
  driver_id: string | null;
  warehouse_id: string | null;
  capacity: number;
  status: VehicleStatus;
}

export interface VehicleCreate {
  vehicle_number: string;
  driver_id?: string | null;
  warehouse_id?: string | null;
  capacity: number;
}

export interface VehicleDeleteResponse {
  id: string;
  deleted_at: string;
}
