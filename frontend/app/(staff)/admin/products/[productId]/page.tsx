import { EditProductClient } from "@/components/products/EditProductClient";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <EditProductClient productId={productId} />;
}
