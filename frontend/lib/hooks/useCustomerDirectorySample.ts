import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/api/customers";

const ORDERS_CUSTOMER_SAMPLE_SIZE = 100;

// Feeds customer-name lookups on the Orders list (which only carries
// customer_id). Caps at a fixed page size rather than paging through the
// whole customer base — good enough to label rows, not a source of truth
// (the Customers screen is). Orders for customers outside the sample just
// fall back to showing their id.
export function useCustomerDirectorySample() {
  return useQuery({
    queryKey: ["customers", "manage", "orders-sample"],
    queryFn: () => listCustomers(1, ORDERS_CUSTOMER_SAMPLE_SIZE),
  });
}
