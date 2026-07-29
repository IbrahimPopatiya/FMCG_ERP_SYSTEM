import { useQuery } from "@tanstack/react-query";
import { listRoutes } from "@/lib/api/salesRoutes";

export function useRoutes() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: listRoutes,
  });
}
