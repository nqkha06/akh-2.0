import type { Prisma } from "@prisma/client";

import type { SystemLogLevel } from "./system-log.constants";

export type SystemLogInput = {
  level: SystemLogLevel;
  category: string;
  context?: string | null;
  event?: string | null;
  message: string;
  metadata?: unknown;
  userId?: number | null;
  adminId?: number | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  stack?: string | null;
  critical?: boolean;
  createdAt?: Date;
};

export type NormalizedSystemLogInput = Omit<
  SystemLogInput,
  "metadata" | "critical" | "createdAt"
> & {
  metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  createdAt?: Date;
};

export type SystemLogWriteInput = Omit<SystemLogInput, "level">;
