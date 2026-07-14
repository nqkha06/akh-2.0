import { notFound } from "next/navigation";

import { getLink } from "@/lib/api-client";
import { SystemStatusPage } from "@/components/status/system-status-page";
import { PublicLinkUnlock } from "./public-link-unlock";

export const dynamic = "force-dynamic";

export default async function PublicLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await getLink(slug).catch(() => null);

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

  return <PublicLinkUnlock link={link} />;
}
