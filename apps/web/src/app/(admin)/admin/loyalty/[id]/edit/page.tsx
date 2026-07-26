import { notFound, redirect } from "next/navigation";

import { getLoyaltyTier } from "@/features/admin-loyalty-tiers/api/loyalty-tiers.server";
import { LoyaltyTierEditor } from "@/features/admin-loyalty-tiers/components/loyalty-tier-editor";
import { requireAdmin } from "@/lib/auth/guards";

export default async function EditLoyaltyTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("loyalty-tiers.update")) {
    redirect("/admin/loyalty");
  }
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const tier = await getLoyaltyTier(id);
  if (!tier) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <LoyaltyTierEditor tier={tier} />
    </main>
  );
}
