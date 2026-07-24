import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SystemStatusPage, type StatusKind } from "@/components/status/system-status-page";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

const states: Record<string, { kind: StatusKind; title: string }> = {
  "not-found": { kind: "linkNotFound", title: "Không tìm thấy link" },
  violation: { kind: "violation", title: "Link bị vô hiệu hoá" },
  deleted: { kind: "deleted", title: "Link đã bị xoá" },
  unavailable: { kind: "unavailable", title: "Link không khả dụng" },
};

export function generateStaticParams() {
  return Object.keys(states).map((state) => ({ state }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const settings = await getPublicSiteSettings();
  return {
    title: `${states[state]?.title ?? "Link không khả dụng"} — ${settings.siteName}`,
  };
}

export default async function LinkStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = states[state];
  if (!config) notFound();
  return <SystemStatusPage kind={config.kind} />;
}
