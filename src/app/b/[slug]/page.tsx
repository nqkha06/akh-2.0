import { notFound } from "next/navigation";

import { getBioPage } from "@/lib/api-client";
import { PublicBioView } from "./public-bio-view";

export const dynamic = "force-dynamic";

export default async function PublicBioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bioPage = await getBioPage(slug).catch(() => null);

  if (!bioPage || bioPage.status !== "published") {
    notFound();
  }

  return <PublicBioView bioPage={bioPage} />;
}
