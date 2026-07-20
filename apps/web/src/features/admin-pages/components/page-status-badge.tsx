import { Badge } from "@/components/ui/badge";
import { pageStatusConfig } from "@/features/admin-pages/page-status";
import type { PageStatus } from "@/features/admin-pages/types";
import { cn } from "@/lib/utils";

export function PageStatusBadge({
  status,
  className,
}: {
  status: PageStatus;
  className?: string;
}) {
  const config = pageStatusConfig[status];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn(config.badgeClassName, className)}
    >
      <Icon />
      {config.label}
    </Badge>
  );
}
