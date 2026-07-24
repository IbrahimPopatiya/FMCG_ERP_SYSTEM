import { useQuery } from "@tanstack/react-query";
import { getCustomerDues } from "@/lib/api/customers";

export function useCustomerDuesById(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "dues"],
    queryFn: () => getCustomerDues(customerId),
    enabled: !!customerId,
  });
}
