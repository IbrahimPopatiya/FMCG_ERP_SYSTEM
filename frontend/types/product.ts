export type ProductStatus = "active" | "inactive";

export interface ProductCreate {
  sku: string;
  barcode: string;
  name: string;
  category_id?: string | null;
  brand_id?: string | null;
  unit: string;
  packing: string;
  mrp: number;
  selling_price: number;
  gst_rate: number;
  minimum_stock: number;
  image?: string | null;
}

export type ProductUpdate = Partial<ProductCreate>;

export interface ProductResponse {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category_id: string | null;
  brand_id: string | null;
  unit: string;
  packing: string;
  mrp: number;
  selling_price: number;
  gst_rate: number;
  minimum_stock: number;
  image: string | null;
  status: ProductStatus;
  created_at: string;
}

// What GET /products returns — the catalog view. Price is pre-resolved
// server-side (customer's own price-list price, or base selling price for
// staff tokens) as `effective_price`.
export interface ProductCatalogResponse {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  brand_id: string | null;
  unit: string;
  packing: string;
  mrp: number;
  effective_price: number;
  gst_rate: number;
  image: string | null;
}
