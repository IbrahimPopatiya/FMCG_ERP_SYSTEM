"use client";

import { ProductDetailPage } from "@/components/shared/ProductDetailPage";
import { useSelectedCustomer } from "@/components/salesman/SelectedCustomerProvider";

export default function SalesmanProductDetailPage() {
  const { customerId } = useSelectedCustomer();

  return (
    <ProductDetailPage
      basePath="/salesman/products"
      cartHref="/salesman/cart"
      cartDisabled={!customerId}
      cartDisabledMessage="Select a customer on the products screen before adding items to their order."
    />
  );
}
