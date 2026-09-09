"use client";

import { ProductsListPage } from "@/components/shared/ProductsListPage";
import { SalesmanProductCard } from "@/components/products/SalesmanProductCard";
import { CustomerSelect } from "@/components/salesman/CustomerSelect";
import { useSelectedCustomer } from "@/components/salesman/SelectedCustomerProvider";

export default function SalesmanProductsPage() {
  const { customerId } = useSelectedCustomer();

  return (
    <ProductsListPage
      disabled={!customerId}
      filterMode="brand"
      headerSlot={
        <div className="mb-3">
          <CustomerSelect />
        </div>
      }
      renderCard={(product, qty, onQtyChange) => (
        <SalesmanProductCard
          key={product.id}
          product={product}
          qty={qty}
          disabled={!customerId}
          onQtyChange={onQtyChange}
        />
      )}
    />
  );
}
