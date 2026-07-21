export type WarehouseStatus = "active" | "inactive";

export interface WarehouseResponse {
  id: string;
  name: string;
  address: string;
  state: string;
  status: WarehouseStatus;
}
