export type RouteStatus = "active" | "inactive";

export interface RouteResponse {
  id: string;
  name: string;
  salesman_id: string | null;
  status: RouteStatus;
}

export interface RouteCreate {
  name: string;
  salesman_id?: string | null;
}

export interface RouteUpdate {
  name?: string;
}

export interface RouteDeleteResponse {
  id: string;
  deleted_at: string;
}
