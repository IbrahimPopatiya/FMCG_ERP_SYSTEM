"use client";

import { useMemo } from "react";
import { HomeFeed, type FeedItem } from "@/components/shared/HomeFeed";
import { useSavedProducts, useToggleSavedProduct } from "@/lib/hooks/useSavedProducts";

export default function HomePage() {
  const savedProducts = useSavedProducts();
  const { toggle: toggleSavedProduct } = useToggleSavedProduct();
  const savedProductIds = useMemo(
    () => new Set((savedProducts.data ?? []).map((s) => s.product.id)),
    [savedProducts.data]
  );

  return (
    <HomeFeed
      shareBasePath="/products"
      savedProductIds={savedProductIds}
      onToggleSave={(product: FeedItem, isSaved: boolean) => toggleSavedProduct(product, isSaved)}
    />
  );
}
