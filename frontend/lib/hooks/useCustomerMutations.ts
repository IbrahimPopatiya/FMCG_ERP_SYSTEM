import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer, setCustomerStatus } from "@/lib/api/customers";
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
