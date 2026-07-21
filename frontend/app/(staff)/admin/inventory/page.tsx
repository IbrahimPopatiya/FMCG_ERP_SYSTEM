import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function InventoryPage() {
  return (
    <div>
      <TopBar title="Inventory" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Inventory screen goes here.</p>
      </div>
    </div>
  );
}
