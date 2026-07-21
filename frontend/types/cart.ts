export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  packing: string;
  price: number;
  gstRate: number;
  image: string | null;
  qty: number;
}
