import { useQuery } from "@tanstack/react-query";
import { getCurrentCustomerLedger } from "@/lib/api/customers";

export function useCustomerLedger() {
  return useQuery({
    queryKey: ["customers", "me", "ledger"],
    queryFn: getCurrentCustomerLedger,
    staleTime: 60 * 1000,
  });
}
