import { Badge } from "@/components/ui/badge";
import { userStatusConfig } from "@/features/admin-users/user-status";
import type { UserStatus } from "@/features/admin-users/types";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config = userStatusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
