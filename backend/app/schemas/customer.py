import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import CustomerCategory, CustomerStatus


class CustomerCreate(BaseModel):
    customer_code: str
    business_name: str
    owner_name: str
    mobile: str
    alternate_mobile: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    credit_limit: Decimal
    payment_terms: int
    route_id: Optional[uuid.UUID] = None
    price_list_id: Optional[uuid.UUID] = None
    category: CustomerCategory = CustomerCategory.RETAIL
    shop_photo_url: Optional[str] = None
    gst_document_url: Optional[str] = None
    pan_document_url: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    # Optional: a salesman adding a customer in the field has no login-password
    # field in the UI. Left unset, the customer is just created without portal
    # login (login_enabled=False) until an admin sets one later.
    password: Optional[str] = None


class CustomerUpdate(BaseModel):
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    mobile: Optional[str] = None
    alternate_mobile: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    payment_terms: Optional[int] = None
    route_id: Optional[uuid.UUID] = None
    price_list_id: Optional[uuid.UUID] = None
    category: Optional[CustomerCategory] = None
    shop_photo_url: Optional[str] = None
    gst_document_url: Optional[str] = None
    pan_document_url: Optional[str] = None
    login_enabled: Optional[bool] = None


class CustomerStatusUpdate(BaseModel):
    status: CustomerStatus


class CustomerLocationUpdate(BaseModel):
    latitude: Decimal
    longitude: Decimal


class CustomerLocationResponse(BaseModel):
    id: uuid.UUID
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerResponse(BaseModel):
    id: uuid.UUID
    customer_code: str
    business_name: str
    status: CustomerStatus
    login_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerMeResponse(BaseModel):
    id: uuid.UUID
    customer_code: str
    business_name: str
    owner_name: str
    mobile: str
    alternate_mobile: Optional[str]
    gst_number: Optional[str]
    pan_number: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    credit_limit: Decimal
    payment_terms: int
    status: CustomerStatus
    category: CustomerCategory = CustomerCategory.RETAIL
    route_id: Optional[uuid.UUID] = None
    shop_photo_url: Optional[str] = None
    gst_document_url: Optional[str] = None
    pan_document_url: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    is_private: bool = False
    created_by_user_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DueInvoiceItem(BaseModel):
    invoice_id: uuid.UUID
    invoice_number: str
    order_id: uuid.UUID
    order_number: str
    invoice_date: datetime
    total: Decimal
    balance: Decimal
    payment_status: str


class CustomerDuesResponse(BaseModel):
    total_due: Decimal
    invoices: list[DueInvoiceItem]


class LedgerTransaction(BaseModel):
    date: datetime
    type: str  # "order" | "payment"
    reference: str
    description: str
    amount: Decimal
    balance: Decimal


class CustomerLedgerResponse(BaseModel):
    credit_limit: Decimal
    available_credit: Decimal
    current_balance: Decimal
    total_invoiced: Decimal
    total_payments: Decimal
    outstanding_invoices: int
    last_order_date: Optional[datetime]
    transactions: list[LedgerTransaction]
