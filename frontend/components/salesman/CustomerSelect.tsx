"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { StoreIcon, ChevronDownIcon } from "@/components/customer/icons";
import { useSalesmanCustomers } from "@/lib/hooks/useSalesmanCustomers";
import { useSelectedCustomer } from "@/components/salesman/SelectedCustomerProvider";

// Replaces the "Products" heading on the salesman's product screen - orders
// placed here are always on behalf of a customer, so picking one is the
// first step, not an afterthought.
export function CustomerSelect() {
  const { data, isLoading } = useSalesmanCustomers();
  const { customerId, setCustomerId } = useSelectedCustomer();
  const customers = data?.items ?? [];
  const selected = customers.find((c) => c.id === customerId);

  return (
    <RadixSelect.Root value={customerId ?? undefined} onValueChange={setCustomerId}>
      <RadixSelect.Trigger className="flex w-full items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-2.5 text-left outline-none transition-colors data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary-soft">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <StoreIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-muted">Select customer</span>
          <RadixSelect.Value>
            <span className="block truncate text-base font-bold tracking-tight text-ink">
              {selected
                ? selected.business_name
                : isLoading
                  ? "Loading customers…"
                  : customers.length === 0
                    ? "No customers on your route"
                    : "Choose a customer"}
            </span>
          </RadixSelect.Value>
        </span>
        <RadixSelect.Icon className="shrink-0 text-ink-muted">
          <ChevronDownIcon className="h-5 w-5" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
        >
          <RadixSelect.Viewport className="max-h-72 w-[var(--radix-select-trigger-width)] p-1">
            {customers.map((customer) => (
              <RadixSelect.Item
                key={customer.id}
                value={customer.id}
                className="flex cursor-pointer flex-col rounded-md px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-primary-soft data-[state=checked]:font-medium"
              >
                <RadixSelect.ItemText>{customer.business_name}</RadixSelect.ItemText>
                <span className="text-xs text-ink-muted">{customer.city}</span>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
