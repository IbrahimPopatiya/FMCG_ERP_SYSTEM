export interface PriceListResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface PriceListCreate {
  name: string;
  description?: string | null;
}

export interface PriceListDeleteResponse {
  id: string;
  deleted_at: string;
}

export interface PriceListItemResponse {
  id: string;
  price_list_id: string;
  product_id: string;
  discount_percent: number;
}

export interface PriceListItemCreate {
  product_id: string;
  discount_percent: number;
}

export interface PriceListItemRemoveResponse {
  id: string;
  removed: boolean;
}
