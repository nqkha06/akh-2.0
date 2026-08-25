"use client";

import { authenticatedApiFetch } from "@/lib/api-client";
import type {
  AdminAnnouncement,
  AnnouncementPayload,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetType,
  AnnouncementDisplay,
  MemberAnnouncement,
  PaginatedAnnouncements,
} from "../types";

async function request<T>(
  path: string,
  init?: RequestInit,
  fallbackMessage = "Yêu cầu không thành công.",
): Promise<T> {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string | string[]; error?: string } | null;
    throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || payload?.error || fallbackMessage);
  }
  return (await response.json()) as T;
}

export function listAdminAnnouncements(filters: {
  search?: string;
  status?: AnnouncementStatus | "all";
  displayType?: AnnouncementDisplay | "all";
  priority?: AnnouncementPriority | "all";
  targetType?: AnnouncementTargetType | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}) {
  const params = new URLSearchParams({ page: String(filters.page || 1), perPage: "20" });
  for (const [key, value] of Object.entries(filters)) {
    if (key !== "page" && value && value !== "all") params.set(key, String(value));
  }
  return request<PaginatedAnnouncements<AdminAnnouncement>>(`/admin/announcements?${params}`);
}

export function getAdminAnnouncement(id: number) {
  return request<AdminAnnouncement>(`/admin/announcements/${id}`);
}

export function createAdminAnnouncement(payload: AnnouncementPayload) {
  return request<AdminAnnouncement>("/admin/announcements", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAdminAnnouncement(id: number, payload: AnnouncementPayload) {
  return request<AdminAnnouncement>(`/admin/announcements/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function publishAdminAnnouncement(id: number) {
  return request<AdminAnnouncement>(`/admin/announcements/${id}/publish`, { method: "POST" });
}

export function pauseAdminAnnouncement(id: number) {
  return request<AdminAnnouncement>(`/admin/announcements/${id}/pause`, { method: "POST" });
}

export function duplicateAdminAnnouncement(id: number) {
  return request<AdminAnnouncement>(`/admin/announcements/${id}/duplicate`, { method: "POST" });
}

export function deleteAdminAnnouncement(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/announcements/${id}`, { method: "DELETE" });
}

export function listMemberAnnouncements(input?: { displayType?: AnnouncementDisplay; page?: number; perPage?: number; locale?: string }) {
  const params = new URLSearchParams({ page: String(input?.page || 1), perPage: String(input?.perPage || 20) });
  if (input?.displayType) params.set("displayType", input.displayType);
  if (input?.locale) params.set("locale", input.locale);
  return request<PaginatedAnnouncements<MemberAnnouncement>>(`/member/announcements?${params}`, { cache: "no-store" }, "");
}

export function getUnreadAnnouncementCount() {
  return request<{ count: number }>("/member/announcements/unread-count", { cache: "no-store" }, "");
}

export function getActiveAnnouncementBanners(locale?: string) {
  return request<MemberAnnouncement[]>(`/member/announcements/active-banners${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`, { cache: "no-store" }, "");
}

export function getActiveAnnouncementModals(locale?: string) {
  return request<MemberAnnouncement[]>(`/member/announcements/active-modals${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`, { cache: "no-store" }, "");
}

export function interactWithAnnouncement(id: number, action: "seen" | "read" | "dismiss" | "acknowledge" | "click") {
  return request<{ success: true }>(`/member/announcements/${id}/${action}`, { method: "POST" }, "");
}

export function readAllAnnouncements() {
  return request<{ updated: number }>("/member/announcements/read-all", { method: "POST" }, "");
}
