export type VehicleStatus = "available" | "in_use" | "maintenance";

export interface VehicleResponse {
  id: string;
  vehicle_number: string;
  driver_id: string | null;
  warehouse_id: string | null;
  capacity: number;
  status: VehicleStatus;
}
