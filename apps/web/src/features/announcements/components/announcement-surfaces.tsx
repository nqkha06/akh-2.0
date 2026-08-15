"use client";

import { ExternalLink, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnnouncementContent, AnnouncementIcon, announcementPlainText, announcementTone } from "./announcement-ui";
import { useAnnouncements } from "./announcements-provider";

export function AnnouncementBanners() {
  const t = useTranslations("Announcements");
  const { banners, dismiss, trackClick } = useAnnouncements();
  if (!banners.length) return null;
  return (
    <div className="space-y-2 px-4 pt-4 sm:px-6 lg:px-8" aria-live="polite">
      {banners.map((announcement) => (
        <div key={announcement.id} className={cn("flex items-start gap-3 rounded-xl border px-3 py-3", announcementTone(announcement.type))}>
          <AnnouncementIcon type={announcement.type} className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{announcementPlainText(announcement.summary || announcement.content)}</p>
          </div>
          {announcement.actionLabel && announcement.actionUrl ? <Button asChild variant="ghost" size="sm" className="h-8 shrink-0"><a href={announcement.actionUrl} target={announcement.actionUrl.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" onClick={() => void trackClick(announcement.id).catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.trackAction")))}>{announcement.actionLabel}<ExternalLink /></a></Button> : null}
          {announcement.isDismissible ? <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label={t("actions.close")} onClick={() => void dismiss(announcement.id).catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.dismiss")))}><X /></Button> : null}
        </div>
      ))}
    </div>
  );
}

export function AnnouncementModal() {
  const t = useTranslations("Announcements");
  const { modals, dismiss, acknowledge, trackClick } = useAnnouncements();
  const announcement = modals[0];
  if (!announcement) return null;
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className={cn("mb-2 grid size-10 place-items-center rounded-xl border", announcementTone(announcement.type))}><AnnouncementIcon type={announcement.type} className="size-5" /></span>
          <AlertDialogTitle>{announcement.title}</AlertDialogTitle>
          {announcement.summary ? <AlertDialogDescription>{announcement.summary}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AnnouncementContent content={announcement.content} />
        <AlertDialogFooter>
          {announcement.isDismissible && !announcement.requiresAcknowledgement ? <AlertDialogCancel onClick={() => void dismiss(announcement.id).catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.dismiss")))}>{t("actions.close")}</AlertDialogCancel> : null}
          {announcement.actionLabel && announcement.actionUrl ? <Button asChild variant="outline"><a href={announcement.actionUrl} target={announcement.actionUrl.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" onClick={() => void trackClick(announcement.id).catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.trackAction")))}>{announcement.actionLabel}<ExternalLink /></a></Button> : null}
          {announcement.requiresAcknowledgement ? <AlertDialogAction onClick={() => void acknowledge(announcement.id).catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.acknowledge")))}>{t("actions.acknowledge")}</AlertDialogAction> : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
