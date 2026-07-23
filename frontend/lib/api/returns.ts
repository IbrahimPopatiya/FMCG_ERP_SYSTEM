import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type {
  ReturnCompleteResponse,
  ReturnCreate,
  ReturnListItem,
  ReturnResponse,
  ReturnStatusResponse,
} from "@/types/returns";

export function listReturns(page: number, pageSize: number) {
  return api
    .get<Page<ReturnListItem>>("/returns", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getReturn(returnId: string) {
  return api.get<ReturnListItem>(`/returns/${returnId}`).then((res) => res.data);
}

export function createReturn(data: ReturnCreate) {
  return api.post<ReturnResponse>("/returns", data).then((res) => res.data);
}

export function approveReturn(returnId: string) {
  return api.post<ReturnStatusResponse>(`/returns/${returnId}/approve`, {}).then((res) => res.data);
}

export function rejectReturn(returnId: string, reason: string) {
  return api
    .post<ReturnStatusResponse>(`/returns/${returnId}/reject`, { reason })
    .then((res) => res.data);
}

export function completeReturn(returnId: string) {
  return api
    .post<ReturnCompleteResponse>(`/returns/${returnId}/complete`, {})
    .then((res) => res.data);
}
