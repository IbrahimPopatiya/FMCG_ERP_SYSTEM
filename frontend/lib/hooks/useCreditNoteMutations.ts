import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveCreditNote, rejectCreditNote } from "@/lib/api/creditNotes";

function invalidateCreditNotes(queryClient: ReturnType<typeof useQueryClient>, creditNoteId?: string) {
  queryClient.invalidateQueries({ queryKey: ["creditNotes"] });
  if (creditNoteId) queryClient.invalidateQueries({ queryKey: ["creditNotes", creditNoteId] });
}

export function useApproveCreditNote(creditNoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveCreditNote(creditNoteId),
    onSuccess: () => invalidateCreditNotes(queryClient, creditNoteId),
  });
}

export function useRejectCreditNote(creditNoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rejectCreditNote(creditNoteId),
    onSuccess: () => invalidateCreditNotes(queryClient, creditNoteId),
  });
}
