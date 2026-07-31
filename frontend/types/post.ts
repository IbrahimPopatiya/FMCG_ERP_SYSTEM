export interface PostCreate {
  image?: string | null;
  product_name: string;
  price: number;
  mrp: number;
  quantity_in_box: number;
}

export interface PostResponse {
  id: string;
  product_id: string;
  image: string | null;
  product_name: string;
  price: number;
  mrp: number;
  quantity_in_box: number;
  created_by: string;
  is_active: boolean;
  created_at: string;
}
