export type SystemLogLevel = "info" | "warn" | "error" | "debug";

export type SystemLogActor = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
};

export type SystemLog = {
  id: string;
  level: SystemLogLevel;
  category: string;
  context: string | null;
  event: string | null;
  message: string;
  userId: number | null;
  adminId: number | null;
  requestId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: SystemLogActor | null;
  admin: SystemLogActor | null;
};

export type SystemLogDetail = SystemLog & {
  metadata: unknown;
  userAgent: string | null;
  stack: string | null;
};

export type SystemLogsResponse = {
  items: SystemLog[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type SystemLogStats = {
  since: string;
  total: number;
  errors: number;
  warnings: number;
  security: number;
};

export type SystemLogCategory = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type RetentionRule = {
  id: number;
  scope: string;
  retentionDays: number;
  enabled: boolean;
};

export type SystemLogSettings = {
  globalRetentionDays: number;
  rules: RetentionRule[];
  categories: SystemLogCategory[];
};
