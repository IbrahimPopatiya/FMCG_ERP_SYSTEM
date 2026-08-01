export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  packing: string;
  price: number;
  // How many pieces are in one box for this product - price is quoted per
  // piece, but `qty` here is the number of boxes the customer selected, so
  // the actual line total is price * unitsPerBox * qty.
  unitsPerBox: number;
  gstRate: number;
  image: string | null;
  qty: number;
}
