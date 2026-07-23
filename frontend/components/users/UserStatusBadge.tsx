import { Badge } from "@/components/ui/Badge";
import type { UserStatus } from "@/types/users";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge tone={status === "active" ? "success" : "neutral"}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}
