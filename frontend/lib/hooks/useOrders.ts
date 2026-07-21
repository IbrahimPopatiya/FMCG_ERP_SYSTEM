import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/lib/api/salesOrders";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });
}
