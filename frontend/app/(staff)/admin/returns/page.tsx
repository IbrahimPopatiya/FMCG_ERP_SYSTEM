import { TopBar } from "@/components/layout/TopBar";

// TODO: implement — see README.md "Conventions" (call lib/hooks/use*, no
// business logic in the page itself).
export default function ReturnsPage() {
  return (
    <div>
      <TopBar title="Returns" />
      <div className="p-4">
        <p className="text-sm text-zinc-500">Returns screen goes here.</p>
      </div>
    </div>
  );
}
