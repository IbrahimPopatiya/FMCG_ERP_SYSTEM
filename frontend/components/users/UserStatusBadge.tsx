import { StatusBadge } from "@/components/shared/StatusBadge";
import type { UserStatus } from "@/types/users";

const TONE: Record<UserStatus, "success" | "neutral"> = { active: "success", inactive: "neutral" };

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
