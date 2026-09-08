import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignCustomerSalesman,
  createCustomer,
  createCustomerAsSalesman,
  deleteCustomer,
  setCustomerStatus,
} from "@/lib/api/customers";
import type { CustomerCreate, CustomerStatus } from "@/types/customers";

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerCreate) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "manage"] });
    },
  });
}

// A salesman creating a customer gets auto-assigned to their route
// server-side, which may also create that route for the first time - so
// invalidate both routes and the salesman-route customer list.
export function useCreateCustomerAsSalesman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerCreate) => createCustomerAsSalesman(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "manage"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "salesman-route"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useSetCustomerStatus(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: CustomerStatus) => setCustomerStatus(customerId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "manage"] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
    },
  });
}

// Deletion is a soft delete on the backend (deleted_at is set) - the
// customer's past orders/invoices/payments stay in the database untouched
// for accounting records, the customer just stops appearing in active lists.
export function useDeleteCustomer(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "manage"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "salesman-route"] });
    },
  });
}

export function useAssignCustomerSalesman(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (salesmanId: string) => assignCustomerSalesman(customerId, salesmanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "manage"] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}
