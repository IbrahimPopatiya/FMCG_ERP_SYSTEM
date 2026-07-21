import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function SuppliersPage() {
  return (
    <div>
      <TopBar title="Suppliers" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Suppliers screen goes here.</p>
      </div>
    </div>
  );
}
