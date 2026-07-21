import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function VehiclesPage() {
  return (
    <div>
      <TopBar title="Vehicles" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Vehicles screen goes here.</p>
      </div>
    </div>
  );
}
