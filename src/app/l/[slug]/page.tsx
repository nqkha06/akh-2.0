import { notFound } from "next/navigation";

import { recordLinkVisit } from "@/lib/api-client";
import { SystemStatusPage } from "@/components/status/system-status-page";
import { PublicLinkUnlock } from "./public-link-unlock";

export const dynamic = "force-dynamic";

export default async function PublicLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await recordLinkVisit(slug).catch(() => null);

  if (!link) {
    notFound();
  }

  const status = link.status.toLowerCase();

  if (["violated", "violation", "blocked", "suspended"].includes(status)) {
    return <SystemStatusPage kind="violation" />;
  }

  if (["deleted", "removed"].includes(status)) {
    return <SystemStatusPage kind="deleted" />;
  }

  if (["inactive", "paused", "expired"].includes(status)) {
    return <SystemStatusPage kind="unavailable" />;
  }

  return <PublicLinkUnlock link={link} />;
}
