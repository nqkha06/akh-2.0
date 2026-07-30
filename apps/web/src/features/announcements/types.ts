export type AnnouncementType = "info" | "success" | "warning" | "danger" | "update";
export type AnnouncementPriority = "low" | "normal" | "high" | "critical";
export type AnnouncementDisplay = "notification" | "banner" | "modal";
export type AnnouncementStatus = "draft" | "scheduled" | "active" | "paused" | "expired";
export type AnnouncementTargetType = "all" | "users" | "roles";

export type AnnouncementTargetRules = {
  userIds?: number[];
  roles?: string[];
};

export type AnnouncementState = {
  seenAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
  ctaClickedAt: string | null;
};

export type MemberAnnouncement = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  actionLabel: string | null;
  actionUrl: string | null;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
  startsAt: string | null;
  endsAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  state: AnnouncementState;
};

export type AnnouncementAnalytics = {
  eligible: number;
  seen: number;
  read: number;
  dismissed: number;
  acknowledged: number;
  clicked: number;
  readRate: number;
  clickRate: number;
};

export type AdminAnnouncement = Omit<MemberAnnouncement, "state"> & {
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetRules: AnnouncementTargetRules;
  analytics: AnnouncementAnalytics;
  createdBy: { id: number; name: string; email: string } | null;
  updatedBy: { id: number; name: string; email: string } | null;
  updatedAt: string;
};

export type AnnouncementPayload = {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetRules: AnnouncementTargetRules;
  actionLabel?: string;
  actionUrl?: string;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type PaginatedAnnouncements<T> = {
  items: T[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
};

export const announcementTypeLabels: Record<AnnouncementType, string> = {
  info: "Thông tin",
  success: "Thành công",
  warning: "Cảnh báo",
  danger: "Khẩn cấp",
  update: "Cập nhật",
};

export const announcementDisplayLabels: Record<AnnouncementDisplay, string> = {
  notification: "Trung tâm thông báo",
  banner: "Banner",
  modal: "Modal",
};

export const announcementStatusLabels: Record<AnnouncementStatus, string> = {
  draft: "Bản nháp",
  scheduled: "Đã lên lịch",
  active: "Đang hoạt động",
  paused: "Đã tạm dừng",
  expired: "Đã hết hạn",
};
