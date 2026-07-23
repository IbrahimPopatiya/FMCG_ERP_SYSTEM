import { useQuery } from "@tanstack/react-query";
import { listPayments } from "@/lib/api/payments";
import { listReturns } from "@/lib/api/returns";

const COLLECTIONS_SAMPLE_SIZE = 100;

// Feeds the Cashier dashboard and Driver Collections screens, which need to
// aggregate across many payments (by driver, by day). There's no bulk
// aggregation endpoint yet, so this pulls a bounded sample the same way
// useCustomerDirectorySample does - good enough for today's collections on
// a distributor's daily payment volume, not a source of truth at any scale.
export function useCashierPaymentsSample() {
  return useQuery({
    queryKey: ["payments", "cashier-sample"],
    queryFn: () => listPayments(1, COLLECTIONS_SAMPLE_SIZE),
    staleTime: 30 * 1000,
  });
}

export function useCashierReturnsSample() {
  return useQuery({
    queryKey: ["returns", "cashier-sample"],
    queryFn: () => listReturns(1, COLLECTIONS_SAMPLE_SIZE),
    staleTime: 30 * 1000,
  });
}
