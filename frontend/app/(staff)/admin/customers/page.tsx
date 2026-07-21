import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function AdminCustomersPage() {
  return (
    <div>
      <TopBar title="Customers" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Customers screen goes here.</p>
      </div>
    </div>
  );
}
