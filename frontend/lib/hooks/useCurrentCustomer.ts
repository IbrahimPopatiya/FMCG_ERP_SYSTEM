import { useQuery } from "@tanstack/react-query";
import { getCurrentCustomer } from "@/lib/api/customers";

export function useCurrentCustomer() {
  return useQuery({
    queryKey: ["customers", "me"],
    queryFn: getCurrentCustomer,
    staleTime: 5 * 60 * 1000,
  });
}
