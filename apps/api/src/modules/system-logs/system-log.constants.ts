export const SYSTEM_LOG_LEVELS = ["info", "warn", "error", "debug"] as const;
export type SystemLogLevel = (typeof SYSTEM_LOG_LEVELS)[number];

export const DEFAULT_SYSTEM_LOG_CATEGORIES = [
  "SYSTEM",
  "HTTP",
  "AUTH",
  "ADMIN",
  "QUEUE",
  "CRON",
  "DATABASE",
  "API",
  "INTEGRATION",
  "SECURITY",
  "BUSINESS",
  "ERROR",
] as const;

export const SYSTEM_LOG_QUEUE = "system-logs";
export const SYSTEM_LOG_PERSIST_JOB = "system-log.persist";
export const SYSTEM_LOG_CLEANUP_JOB = "system-log.cleanup";
export const SYSTEM_LOG_CLEANUP_SCHEDULER = "system-log.cleanup.daily";

export const SYSTEM_LOG_RETENTION_SCOPE_PATTERN =
  /^(?:GLOBAL|CATEGORY:[A-Z][A-Z0-9_-]{1,39}|LEVEL:(?:INFO|WARN|ERROR|DEBUG))$/;
