export const ANNOUNCEMENT_TYPES = ["info", "success", "warning", "danger", "update"] as const;
export const ANNOUNCEMENT_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export const ANNOUNCEMENT_DISPLAYS = ["notification", "banner", "modal"] as const;
export const ANNOUNCEMENT_STATUSES = ["draft", "scheduled", "active", "paused", "expired"] as const;
export const ANNOUNCEMENT_TARGET_TYPES = ["all", "users", "roles"] as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

