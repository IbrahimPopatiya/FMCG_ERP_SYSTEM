import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type { CreditNoteResponse, CreditNoteStatusResponse } from "@/types/creditNotes";

export function listCreditNotes(page: number, pageSize: number) {
  return api
    .get<Page<CreditNoteResponse>>("/credit-notes", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getCreditNote(creditNoteId: string) {
  return api.get<CreditNoteResponse>(`/credit-notes/${creditNoteId}`).then((res) => res.data);
}

export function approveCreditNote(creditNoteId: string) {
  return api
    .post<CreditNoteStatusResponse>(`/credit-notes/${creditNoteId}/approve`, {})
    .then((res) => res.data);
}

export function rejectCreditNote(creditNoteId: string) {
  return api
    .post<CreditNoteStatusResponse>(`/credit-notes/${creditNoteId}/reject`, {})
    .then((res) => res.data);
}
