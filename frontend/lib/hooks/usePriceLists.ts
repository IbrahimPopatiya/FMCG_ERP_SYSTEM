import { useQuery } from "@tanstack/react-query";
import { getPriceList, listPriceListItems, listPriceLists } from "@/lib/api/priceLists";

export function usePriceLists() {
  return useQuery({
    queryKey: ["priceLists"],
    queryFn: listPriceLists,
  });
}

export function usePriceList(priceListId: string) {
  return useQuery({
    queryKey: ["priceLists", priceListId],
    queryFn: () => getPriceList(priceListId),
    enabled: !!priceListId,
  });
}

export function usePriceListItems(priceListId: string) {
  return useQuery({
    queryKey: ["priceLists", priceListId, "items"],
    queryFn: () => listPriceListItems(priceListId),
    enabled: !!priceListId,
  });
}
