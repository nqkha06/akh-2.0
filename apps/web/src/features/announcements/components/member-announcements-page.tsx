"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { listMemberAnnouncements } from "../api/announcements.client";
import type { MemberAnnouncement } from "../types";
import {
  AnnouncementContent,
  AnnouncementIcon,
  announcementPlainText,
  announcementTone,
} from "./announcement-ui";
import { useAnnouncements } from "./announcements-provider";

type AnnouncementFilter = "all" | "unread" | "read";

export function MemberAnnouncementsPage() {
  const t = useTranslations("Announcements");
  const locale = useLocale();
  const { markRead, markAllRead, trackClick } = useAnnouncements();
  const [items, setItems] = React.useState<MemberAnnouncement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [filter, setFilter] = React.useState<AnnouncementFilter>("all");
  const [expanded, setExpanded] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMemberAnnouncements({
        displayType: "notification",
        perPage: 50,
        locale,
      });
      setItems(result.items);
      const focusId = Number(
        new URLSearchParams(window.location.search).get("focus"),
      );
      if (
        Number.isInteger(focusId) &&
        result.items.some((item) => item.id === focusId)
      ) {
        setExpanded(focusId);
      }
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t("errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  React.useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  const counts = React.useMemo(() => {
    const unread = items.filter((item) => !item.state.readAt).length;
    return { all: items.length, unread, read: items.length - unread };
  }, [items]);

  const visible = React.useMemo(
    () =>
      items.filter(
        (item) =>
          filter === "all" ||
          (filter === "unread" ? !item.state.readAt : Boolean(item.state.readAt)),
      ),
    [filter, items],
  );

  async function toggle(item: MemberAnnouncement) {
    const next = expanded === item.id ? null : item.id;
    setExpanded(next);
    if (next && !item.state.readAt) {
      try {
        await markRead(item.id);
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  state: { ...entry.state, readAt: new Date().toISOString() },
                }
              : entry,
          ),
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            && error.message
            ? error.message
            : t("errors.markRead"),
        );
      }
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllRead();
      const readAt = new Date().toISOString();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          state: { ...item.state, readAt: item.state.readAt || readAt },
        })),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          && error.message
          ? error.message
          : t("errors.update"),
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <PageContainer className="max-w-5xl">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground">
          {t("title")}
        </h1>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("actions.refresh")}
          title={t("actions.refresh")}
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as AnnouncementFilter)}
        >
          <TabsList className="w-full sm:w-auto">
            <FilterTab value="all" label={t("filters.all")} count={counts.all} />
            <FilterTab value="unread" label={t("filters.unread")} count={counts.unread} />
            <FilterTab value="read" label={t("filters.read")} count={counts.read} />
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-end gap-2">
          {counts.unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={markingAll}
              onClick={() => void handleMarkAllRead()}
            >
              <CheckCheck />
              {t("actions.markAllRead")}
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <AnnouncementsSkeleton />
      ) : visible.length ? (
        <div className="space-y-2.5">
          {visible.map((item) => (
            <AnnouncementRow
              key={item.id}
              item={item}
              open={expanded === item.id}
              onToggle={() => void toggle(item)}
              onAction={() =>
                void trackClick(item.id).catch((error) =>
                  toast.error(
                    error instanceof Error
                      && error.message
                      ? error.message
                      : t("errors.trackAction"),
                  ),
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyAnnouncements filter={filter} />
      )}
    </PageContainer>
  );
}

function FilterTab({
  value,
  label,
  count,
}: {
  value: AnnouncementFilter;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger value={value} className="flex-1 gap-1.5 sm:flex-none">
      {label}
      <span className="min-w-5 rounded-full bg-background/70 px-1.5 text-[10px] tabular-nums text-muted-foreground">
        {count}
      </span>
    </TabsTrigger>
  );
}

function AnnouncementRow({
  item,
  open,
  onToggle,
  onAction,
}: {
  item: MemberAnnouncement;
  open: boolean;
  onToggle: () => void;
  onAction: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Announcements");
  const unread = !item.state.readAt;
  const externalAction = Boolean(
    item.actionUrl && !item.actionUrl.startsWith("/"),
  );

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-xl border-border py-0 shadow-none transition-colors",
        unread && "border-primary/25 bg-primary/[0.02]",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:gap-4 sm:px-5"
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl border",
            announcementTone(item.type),
          )}
        >
          <AnnouncementIcon type={item.type} className="size-[18px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 text-sm leading-5",
                unread ? "font-semibold text-foreground" : "font-medium",
              )}
            >
              {item.title}
            </span>
            {unread ? (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                aria-label={t("status.unread")}
              />
            ) : null}
          </span>

          {!open ? (
            <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
              {announcementPreview(item.summary || item.content)}
            </span>
          ) : null}

          <time
            dateTime={item.publishedAt || item.createdAt}
            className="mt-2 block text-[11px] tabular-nums text-muted-foreground"
          >
            {formatAnnouncementDate(item.publishedAt || item.createdAt, locale)}
          </time>
        </span>

        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="border-t border-border/80 bg-muted/[0.12] px-4 py-5 sm:px-[4.75rem]">
          <AnnouncementContent content={item.content} />
          {item.actionLabel && item.actionUrl ? (
            <Button asChild size="sm" className="mt-4">
              <Link
                href={item.actionUrl}
                target={externalAction ? "_blank" : undefined}
                rel={externalAction ? "noopener noreferrer" : undefined}
                onClick={onAction}
              >
                {item.actionLabel}
                {externalAction ? <ExternalLink /> : <ChevronRight />}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function AnnouncementsSkeleton() {
  const t = useTranslations("Announcements");
  return (
    <div className="space-y-2.5" aria-label={t("loading")}>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="flex items-start gap-4 rounded-xl border border-border px-4 py-4 sm:px-5"
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyAnnouncements({ filter }: { filter: AnnouncementFilter }) {
  const t = useTranslations("Announcements");
  const message =
    filter === "unread"
      ? t("empty.unread")
      : filter === "read"
        ? t("empty.read")
        : t("empty.all");

  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <AnnouncementIcon type="info" className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium">{message}</p>
    </div>
  );
}

function announcementPreview(value: string, maxLength = 180) {
  const plainText = announcementPlainText(value);
  if (plainText.length <= maxLength) return plainText;
  const candidate = plainText.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, lastSpace > 100 ? lastSpace : maxLength).trim()}…`;
}

function formatAnnouncementDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
