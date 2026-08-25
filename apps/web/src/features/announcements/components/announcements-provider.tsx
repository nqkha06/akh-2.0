"use client";

import * as React from "react";
import { useLocale } from "next-intl";

import {
  getActiveAnnouncementBanners,
  getActiveAnnouncementModals,
  getUnreadAnnouncementCount,
  interactWithAnnouncement,
  listMemberAnnouncements,
  readAllAnnouncements,
} from "../api/announcements.client";
import type { MemberAnnouncement } from "../types";

type AnnouncementsContextValue = {
  notifications: MemberAnnouncement[];
  banners: MemberAnnouncement[];
  modals: MemberAnnouncement[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: number) => Promise<void>;
  acknowledge: (id: number) => Promise<void>;
  trackClick: (id: number) => Promise<void>;
};

const AnnouncementsContext = React.createContext<AnnouncementsContextValue | null>(null);

export function AnnouncementsProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [notifications, setNotifications] = React.useState<MemberAnnouncement[]>([]);
  const [banners, setBanners] = React.useState<MemberAnnouncement[]>([]);
  const [modals, setModals] = React.useState<MemberAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const seen = React.useRef(new Set<number>());

  const refresh = React.useCallback(async () => {
    const [notificationResult, bannerResult, modalResult, countResult] = await Promise.all([
      listMemberAnnouncements({ displayType: "notification", perPage: 8, locale }),
      getActiveAnnouncementBanners(locale),
      getActiveAnnouncementModals(locale),
      getUnreadAnnouncementCount(),
    ]);
    setNotifications(notificationResult.items);
    setBanners(bannerResult);
    setModals(modalResult);
    setUnreadCount(countResult.count);
    for (const item of [...bannerResult, ...modalResult]) {
      if (!seen.current.has(item.id)) {
        seen.current.add(item.id);
        void interactWithAnnouncement(item.id, "seen");
      }
    }
  }, [locale]);

  React.useEffect(() => {
    let active = true;
    const initialLoad = window.setTimeout(() => {
      void refresh().catch(() => undefined).finally(() => { if (active) setLoading(false); });
    }, 0);
    const interval = window.setInterval(() => void refresh().catch(() => undefined), 90_000);
    return () => { active = false; window.clearTimeout(initialLoad); window.clearInterval(interval); };
  }, [refresh]);

  async function markRead(id: number) {
    const target = notifications.find((item) => item.id === id);
    if (target && !target.state.readAt) setUnreadCount((count) => Math.max(0, count - 1));
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, state: { ...item.state, readAt: new Date().toISOString() } } : item));
    try {
      await interactWithAnnouncement(id, "read");
    } catch (error) {
      await refresh().catch(() => undefined);
      throw error;
    }
  }

  async function markAllRead() {
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, state: { ...item.state, readAt: item.state.readAt || new Date().toISOString() } })));
    try {
      await readAllAnnouncements();
    } catch (error) {
      await refresh().catch(() => undefined);
      throw error;
    }
  }

  async function dismiss(id: number) {
    setBanners((items) => items.filter((item) => item.id !== id));
    setModals((items) => items.filter((item) => item.id !== id));
    setNotifications((items) => items.filter((item) => item.id !== id));
    try {
      await interactWithAnnouncement(id, "dismiss");
    } catch (error) {
      await refresh().catch(() => undefined);
      throw error;
    }
  }

  async function acknowledge(id: number) {
    setModals((items) => items.filter((item) => item.id !== id));
    try {
      await interactWithAnnouncement(id, "acknowledge");
    } catch (error) {
      await refresh().catch(() => undefined);
      throw error;
    }
  }

  async function trackClick(id: number) {
    await interactWithAnnouncement(id, "click");
    await refresh();
  }

  return <AnnouncementsContext.Provider value={{ notifications, banners, modals, unreadCount, loading, refresh, markRead, markAllRead, dismiss, acknowledge, trackClick }}>{children}</AnnouncementsContext.Provider>;
}

export function useAnnouncements() {
  const context = React.useContext(AnnouncementsContext);
  if (!context) throw new Error("useAnnouncements must be used inside AnnouncementsProvider");
  return context;
}
