import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function InvoicesPage() {
  return (
    <div>
      <TopBar title="Invoices" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Invoices screen goes here.</p>
      </div>
    </div>
  );
}
