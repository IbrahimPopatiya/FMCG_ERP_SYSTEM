import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function PurchasesPage() {
  return (
    <div>
      <TopBar title="Purchases" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Purchases screen goes here.</p>
      </div>
    </div>
  );
}
