import { notFound, redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { getMonetizationLevel } from "@/features/admin-monetization-levels/api/monetization-levels.server";
import { MonetizationLevelEditor } from "@/features/admin-monetization-levels/components/monetization-level-editor";
import { requireAdmin } from "@/lib/auth/guards";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CreateMonetizationLevelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("monetization-levels.create")) {
    redirect("/admin/monetization-levels");
  }

  const from = singleValue((await searchParams).from);
  const sourceId = from ? Number(from) : null;
  const hasSource = sourceId && Number.isSafeInteger(sourceId) && sourceId > 0;
  const template = hasSource ? await getMonetizationLevel(sourceId) : null;
  if (hasSource && !template) notFound();

  return (
    <>
      <AdminHeader
        title={
          template ? "Nhân bản Monetization Level" : "Tạo Monetization Level"
        }
      />
      <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
        <MonetizationLevelEditor
          level={null}
          template={template ?? undefined}
        />
      </main>
    </>
  );
}

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
