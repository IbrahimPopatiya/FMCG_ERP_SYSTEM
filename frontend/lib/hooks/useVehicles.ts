import { useQuery } from "@tanstack/react-query";
import { listVehicles } from "@/lib/api/vehicles";

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });
}
