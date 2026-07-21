import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function AdminOrderDetailPage() {
  return (
    <div>
      <TopBar title="Order Detail" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Order Detail screen goes here.</p>
      </div>
    </div>
  );
}
