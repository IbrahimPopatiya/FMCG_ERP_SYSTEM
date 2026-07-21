export type SupplierStatus = "active" | "inactive";

export interface SupplierResponse {
  id: string;
  supplier_code: string;
  name: string;
  gst_number: string | null;
  mobile: string;
  address: string;
  status: SupplierStatus;
}

export interface SupplierCreate {
  supplier_code: string;
  name: string;
  gst_number?: string | null;
  mobile: string;
  address: string;
}
