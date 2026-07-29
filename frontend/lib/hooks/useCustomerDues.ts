import { useQuery } from "@tanstack/react-query";
import { getCurrentCustomerDues } from "@/lib/api/customers";

export function useCustomerDues() {
  return useQuery({
    queryKey: ["customers", "me", "dues"],
    queryFn: getCurrentCustomerDues,
    staleTime: 60 * 1000,
  });
}
