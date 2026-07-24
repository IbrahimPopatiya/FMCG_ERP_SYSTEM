import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/api/customers";

// Single-page customer list (as opposed to useCustomersManage's infinite
// scroll) — used where the whole visible set is needed at once, e.g. the
// salesman dashboard's summary tiles and My Customers tab.
export function useCustomers(pageSize = 100, search?: string) {
  return useQuery({
    queryKey: ["customers", "all", pageSize, search],
    queryFn: () => listCustomers(1, pageSize, search),
  });
}
