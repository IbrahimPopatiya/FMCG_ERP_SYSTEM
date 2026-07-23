import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveReturn, completeReturn, createReturn, rejectReturn } from "@/lib/api/returns";
import type { ReturnCreate } from "@/types/returns";

function invalidateReturns(queryClient: ReturnType<typeof useQueryClient>, returnId?: string) {
  queryClient.invalidateQueries({ queryKey: ["returns"] });
  queryClient.invalidateQueries({ queryKey: ["creditNotes"] });
  if (returnId) queryClient.invalidateQueries({ queryKey: ["returns", returnId] });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReturnCreate) => createReturn(data),
    onSuccess: () => invalidateReturns(queryClient),
  });
}

export function useApproveReturn(returnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveReturn(returnId),
    onSuccess: () => invalidateReturns(queryClient, returnId),
  });
}

export function useRejectReturn(returnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => rejectReturn(returnId, reason),
    onSuccess: () => invalidateReturns(queryClient, returnId),
  });
}

export function useCompleteReturn(returnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeReturn(returnId),
    onSuccess: () => invalidateReturns(queryClient, returnId),
  });
}
