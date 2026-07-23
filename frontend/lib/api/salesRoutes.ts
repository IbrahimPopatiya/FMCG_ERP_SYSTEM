import { api } from "@/lib/api/client";
import type { RouteCreate, RouteDeleteResponse, RouteResponse, RouteUpdate } from "@/types/salesRoutes";

export function listRoutes() {
  return api.get<RouteResponse[]>("/routes").then((res) => res.data);
}

export function createRoute(data: RouteCreate) {
  return api.post<RouteResponse>("/routes", data).then((res) => res.data);
}

export function updateRoute(routeId: string, data: RouteUpdate) {
  return api.patch<RouteResponse>(`/routes/${routeId}`, data).then((res) => res.data);
}

export function assignRouteSalesman(routeId: string, salesmanId: string) {
  return api
    .patch<RouteResponse>(`/routes/${routeId}/salesman`, { salesman_id: salesmanId })
    .then((res) => res.data);
}

export function deleteRoute(routeId: string) {
  return api.delete<RouteDeleteResponse>(`/routes/${routeId}`).then((res) => res.data);
}
