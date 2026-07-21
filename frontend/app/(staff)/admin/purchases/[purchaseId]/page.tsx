import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function PurchaseDetailPage() {
  return (
    <div>
      <TopBar title="Purchase Detail" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Purchase Detail screen goes here.</p>
      </div>
    </div>
  );
}
