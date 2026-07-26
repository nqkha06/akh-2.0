import { notFound, redirect } from "next/navigation";

import { getLoyaltyTier } from "@/features/admin-loyalty-tiers/api/loyalty-tiers.server";
import { LoyaltyTierEditor } from "@/features/admin-loyalty-tiers/components/loyalty-tier-editor";
import { requireAdmin } from "@/lib/auth/guards";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CreateLoyaltyTierPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("loyalty-tiers.create")) {
    redirect("/admin/loyalty");
  }

  const value = (await searchParams).from;
  const from = Array.isArray(value) ? value[0] : value;
  const sourceId = from ? Number(from) : null;
  const hasSource = Boolean(
    sourceId && Number.isSafeInteger(sourceId) && sourceId > 0,
  );
  const template = hasSource ? await getLoyaltyTier(sourceId!) : null;
  if (hasSource && !template) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <LoyaltyTierEditor tier={null} template={template ?? undefined} />
    </main>
  );
}
