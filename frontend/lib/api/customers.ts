import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type {
  CustomerCreate,
  CustomerCreateResponse,
  CustomerListItem,
  CustomerMeResponse,
  CustomerStatus,
} from "@/types/customers";

export function getCurrentCustomer() {
  return api.get<CustomerMeResponse>("/customers/me").then((res) => res.data);
}

export function listCustomers(page: number, pageSize: number, search?: string) {
  return api
    .get<Page<CustomerListItem>>("/customers", { params: { page, page_size: pageSize, search } })
    .then((res) => res.data);
}

export function getCustomer(customerId: string) {
  return api.get<CustomerListItem>(`/customers/${customerId}`).then((res) => res.data);
}

export function createCustomer(data: CustomerCreate) {
  return api.post<CustomerCreateResponse>("/customers", data).then((res) => res.data);
}

export function setCustomerStatus(customerId: string, status: CustomerStatus) {
  return api
    .patch<CustomerCreateResponse>(`/customers/${customerId}/status`, { status })
    .then((res) => res.data);
}
