import { notFound, redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { getMonetizationLevel } from "@/features/admin-monetization-levels/api/monetization-levels.server";
import { MonetizationLevelEditor } from "@/features/admin-monetization-levels/components/monetization-level-editor";
import { requireAdmin } from "@/lib/auth/guards";

export default async function EditMonetizationLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("monetization-levels.update")) {
    redirect("/admin/monetization-levels");
  }

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const level = await getMonetizationLevel(id);
  if (!level) notFound();

  return (
    <>
      <AdminHeader title={`Chỉnh sửa ${level.displayName}`} />
      <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
        <MonetizationLevelEditor level={level} />
      </main>
    </>
  );
}
