import { ProductCard } from "@/components/shared/ProductCard";
import type { ProductCatalogResponse } from "@/types/product";

interface SalesmanProductCardProps {
  product: ProductCatalogResponse;
  qty: number;
  disabled?: boolean;
  onQtyChange: (product: ProductCatalogResponse, qty: number) => void;
}

// Same card as CustomerProductCard, pointed at /salesman/products/[id] and
// able to disable "add to cart" until a customer has been picked.
export function SalesmanProductCard(props: SalesmanProductCardProps) {
  return <ProductCard {...props} basePath="/salesman/products" showLoadingCapacity />;
}
