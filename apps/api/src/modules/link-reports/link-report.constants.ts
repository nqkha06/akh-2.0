export const LINK_REPORT_REASONS = [
  "spam",
  "malware",
  "impersonation",
  "copyright",
  "adult",
  "other",
] as const;

export const LINK_REPORT_STATUSES = [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type LinkReportStatus = (typeof LINK_REPORT_STATUSES)[number];
