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
      headerSlot={
        <div className="mb-3">
          <CustomerSelect />
          {!customerId && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Choose a customer above before adding items to their order.
            </p>
          )}
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
