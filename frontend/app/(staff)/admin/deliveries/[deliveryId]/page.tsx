import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function DeliveryDetailPage() {
  return (
    <div>
      <TopBar title="Delivery Detail" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Delivery Detail screen goes here.</p>
      </div>
    </div>
  );
}
