import { notFound } from "next/navigation";

import { getLink } from "@/lib/api-client";
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

  return <PublicLinkUnlock link={link} />;
}
