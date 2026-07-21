import { useQuery } from "@tanstack/react-query";
import { getInventory } from "@/lib/api/inventory";

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory,
  });
}
