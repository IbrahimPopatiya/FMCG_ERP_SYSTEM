import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignRouteSalesman, createRoute, deleteRoute } from "@/lib/api/salesRoutes";
import type { RouteCreate } from "@/types/salesRoutes";

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RouteCreate) => createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useAssignRouteSalesman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, salesmanId }: { routeId: string; salesmanId: string }) =>
      assignRouteSalesman(routeId, salesmanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}
