import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCreditNote, listCreditNotes } from "@/lib/api/creditNotes";

const PAGE_SIZE = 20;

export function useCreditNotesManage() {
  return useInfiniteQuery({
    queryKey: ["creditNotes", "manage"],
    queryFn: ({ pageParam }) => listCreditNotes(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useCreditNote(creditNoteId: string) {
  return useQuery({
    queryKey: ["creditNotes", creditNoteId],
    queryFn: () => getCreditNote(creditNoteId),
    enabled: !!creditNoteId,
  });
}

const CREDIT_NOTE_SAMPLE_SIZE = 100;

// Feeds the "view credit note" link on a completed Return - capped sample,
// not a source of truth (the Credit Notes screen is).
export function useCreditNoteSample() {
  return useQuery({
    queryKey: ["creditNotes", "manage", "return-sample"],
    queryFn: () => listCreditNotes(1, CREDIT_NOTE_SAMPLE_SIZE),
  });
}
