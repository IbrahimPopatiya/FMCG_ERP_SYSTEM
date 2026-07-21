import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function NewProductPage() {
  return (
    <div>
      <TopBar title="New Product" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">New Product screen goes here.</p>
      </div>
    </div>
  );
}
