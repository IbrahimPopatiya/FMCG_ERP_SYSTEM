export type CustomerStatus = "active" | "inactive" | "blocked";

export interface CustomerMeResponse {
  id: string;
  customer_code: string;
  business_name: string;
  owner_name: string;
  mobile: string;
  alternate_mobile: string | null;
  gst_number: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  credit_limit: number;
  payment_terms: number;
  status: CustomerStatus;
}

// GET /customers (list) and GET /customers/{id} (detail) return the same
// shape as /customers/me — full profile, staff-viewable.
export type CustomerListItem = CustomerMeResponse;

// POST /customers returns this narrower shape (see backend/app/schemas/customer.py).
export interface CustomerCreateResponse {
  id: string;
  customer_code: string;
  business_name: string;
  status: CustomerStatus;
  login_enabled: boolean;
  created_at: string;
}

export interface CustomerCreate {
  customer_code: string;
  business_name: string;
  owner_name: string;
  mobile: string;
  alternate_mobile?: string | null;
  gst_number?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  credit_limit: number;
  payment_terms: number;
  password: string;
}

export interface DueInvoiceItem {
  invoice_id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  invoice_date: string;
  total: number;
  balance: number;
  payment_status: string;
}

export interface CustomerDuesResponse {
  total_due: number;
  invoices: DueInvoiceItem[];
}
