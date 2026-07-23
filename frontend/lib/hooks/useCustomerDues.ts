import { useQuery } from "@tanstack/react-query";
import { getCurrentCustomerDues, getCustomerDues } from "@/lib/api/customers";

export function useCustomerDues() {
  return useQuery({
    queryKey: ["customers", "me", "dues"],
    queryFn: getCurrentCustomerDues,
    staleTime: 60 * 1000,
  });
}

export function useCustomerDuesById(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId, "dues"],
    queryFn: () => getCustomerDues(customerId),
    enabled: !!customerId,
    staleTime: 60 * 1000,
  });
}
