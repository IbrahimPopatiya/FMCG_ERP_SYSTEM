"use client";

import { ProductDetailPage } from "@/components/shared/ProductDetailPage";

export default function CustomerProductDetailPage() {
  return <ProductDetailPage basePath="/products" cartHref="/cart" />;
}
