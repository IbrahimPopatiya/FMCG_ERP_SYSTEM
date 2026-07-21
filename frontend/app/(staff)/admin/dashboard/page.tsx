import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function DashboardPage() {
  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Dashboard screen goes here.</p>
      </div>
    </div>
  );
}
