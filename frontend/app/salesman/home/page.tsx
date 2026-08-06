"use client";

import { useState } from "react";
import { HomeFeed, type FeedItem } from "@/components/shared/HomeFeed";
import { useSelectedCustomer } from "@/components/salesman/SelectedCustomerProvider";

// Same reel-style feed as the customer Home screen (components/shared/HomeFeed)
// so a salesman browsing products for a customer sees the same promoted-post
// feed. Saving/bookmarking a product is customer-account state on the backend
// (POST /saved-products requires a customer principal) — a salesman has no
// such account, so "save" here is just a local UI toggle, not persisted.
export default function SalesmanHomePage() {
  const { customerId } = useSelectedCustomer();
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());

  function handleToggleSave(product: FeedItem, isSaved: boolean) {
    setSavedProductIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
  }

  return (
    <HomeFeed
      shareBasePath="/salesman/products"
      savedProductIds={savedProductIds}
      onToggleSave={handleToggleSave}
      cartDisabled={!customerId}
      cartDisabledMessage="Select a customer on the Products screen before adding items to their order."
    />
  );
}
