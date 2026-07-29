export type CreditNoteStatus = "pending" | "approved" | "rejected";

export interface CreditNoteResponse {
  id: string;
  return_id: string;
  customer_id: string;
  amount: number;
  status: CreditNoteStatus;
  created_at: string;
}

export interface CreditNoteStatusResponse {
  id: string;
  status: CreditNoteStatus;
  approved_by: string | null;
  updated_at: string;
}
