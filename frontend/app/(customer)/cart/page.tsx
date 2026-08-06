"use client";

import { isAxiosError } from "axios";
import { CartPage } from "@/components/shared/CartPage";

function placeOrderErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "No active warehouse can fulfil this order right now. Please try again later.";
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return "One of the items in your cart is no longer available. Please review your cart.";
  }
  return "Couldn't place your order. Please check your connection and try again.";
}

export default function CustomerCartPage() {
  return (
    <CartPage
      title="My Cart"
      emptyCartTitle="Your cart is empty"
      emptyCartMessage="Browse the catalog and add items to place an order."
      removeConfirmMessage={(name) => `Remove ${name} from your cart?`}
      productsBasePath="/products"
      orderBasePath="/orders"
      placeOrderErrorMessage={placeOrderErrorMessage}
    />
  );
}
