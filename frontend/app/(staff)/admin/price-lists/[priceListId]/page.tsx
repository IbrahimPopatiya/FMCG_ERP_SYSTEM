import { PriceListDetailClient } from "@/components/priceLists/PriceListDetailClient";

export default async function PriceListDetailPage({
  params,
}: {
  params: Promise<{ priceListId: string }>;
}) {
  const { priceListId } = await params;
  return <PriceListDetailClient priceListId={priceListId} />;
}
