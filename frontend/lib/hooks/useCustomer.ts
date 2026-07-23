import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/lib/api/customers";

export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: !!customerId,
  });
}
