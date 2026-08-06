import { ProductCard } from "@/components/shared/ProductCard";
import type { ProductCatalogResponse } from "@/types/product";

interface CustomerProductCardProps {
  product: ProductCatalogResponse;
  qty: number;
  onQtyChange: (product: ProductCatalogResponse, qty: number) => void;
}

export function CustomerProductCard(props: CustomerProductCardProps) {
  return <ProductCard {...props} basePath="/products" />;
}
