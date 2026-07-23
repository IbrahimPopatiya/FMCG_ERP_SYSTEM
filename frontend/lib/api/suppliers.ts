import { api } from "@/lib/api/client";
import type { SupplierCreate, SupplierResponse, SupplierStatus } from "@/types/suppliers";

export function listSuppliers() {
  return api.get<SupplierResponse[]>("/suppliers").then((res) => res.data);
}

export function createSupplier(data: SupplierCreate) {
  return api.post<SupplierResponse>("/suppliers", data).then((res) => res.data);
}

export function setSupplierStatus(supplierId: string, status: SupplierStatus) {
  return api
    .patch<SupplierResponse>(`/suppliers/${supplierId}/status`, { status })
    .then((res) => res.data);
}
