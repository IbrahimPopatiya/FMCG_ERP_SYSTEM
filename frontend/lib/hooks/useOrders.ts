import { useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "@/lib/api/salesOrders";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
  });
}
