"use client";

import { isAxiosError } from "axios";
import { CartPage } from "@/components/shared/CartPage";
import { StoreIcon } from "@/components/customer/icons";
import { useSalesmanCustomers } from "@/lib/hooks/useSalesmanCustomers";
import { useSelectedCustomer } from "@/components/salesman/SelectedCustomerProvider";

function placeOrderErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 403) {
    return "You may only place orders for customers on your own route.";
  }
  if (isAxiosError(error) && error.response?.status === 409) {
    return "No active warehouse can fulfil this order right now. Please try again later.";
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return "One of the items in your cart or the selected customer is no longer available.";
  }
  return "Couldn't place the order. Please check your connection and try again.";
}

export default function SalesmanCartPage() {
  const { data: customersPage } = useSalesmanCustomers();
  const { customerId, setCustomerId } = useSelectedCustomer();
  const customer = customersPage?.items.find((c) => c.id === customerId);

  return (
    <CartPage
      title="Order Bag"
      emptyCartTitle="The bag is empty"
      emptyCartMessage="Browse the catalog and add items to build the customer's order."
      removeConfirmMessage={(name) => `Remove ${name} from the bag?`}
      productsBasePath="/salesman/products"
      orderBasePath="/salesman/orders"
      placeOrderErrorMessage={placeOrderErrorMessage}
      showLoadingCapacity
      buildOrderPayload={() => ({ customer_id: customerId ?? undefined })}
      canPlaceOrder={!!customerId}
      onOrderPlaced={() => setCustomerId(null)}
      headerSlot={
        customer && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-primary">
            <StoreIcon className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium">Ordering for {customer.business_name}</span>
          </div>
        )
      }
      belowHeaderSlot={
        !customer && (
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            No customer selected. Go back to Products to choose one before placing this order.
          </div>
        )
      }
    />
  );
}
