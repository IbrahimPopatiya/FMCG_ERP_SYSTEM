import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignCustomerSalesman, createCustomer, setCustomerStatus } from "@/lib/api/customers";
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
