import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/api/customers";
import { listRoutes } from "@/lib/api/salesRoutes";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// A salesman only sees customers on the route assigned to them (one route
// per salesman today - see RouteResponse.salesman_id) so the order-entry
// customer picker can't accidentally place an order for someone outside
// their beat; the backend enforces the same rule on order create.
export function useSalesmanRoute() {
  const currentUser = useCurrentUser();
  const routes = useQuery({ queryKey: ["routes"], queryFn: listRoutes });
  const route = routes.data?.find((r) => r.salesman_id === currentUser.data?.id) ?? null;
  return { route, isLoading: currentUser.isLoading || routes.isLoading };
}

export function useSalesmanCustomers() {
  const { route, isLoading: routeLoading } = useSalesmanRoute();
  const query = useQuery({
    queryKey: ["customers", "salesman-route", route?.id],
    queryFn: () => listCustomers(1, 100, undefined, route!.id),
    enabled: !!route,
  });
  return { ...query, isLoading: routeLoading || query.isLoading, route };
}
