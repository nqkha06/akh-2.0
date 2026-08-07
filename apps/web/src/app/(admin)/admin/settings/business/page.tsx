import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminBusinessSettings } from "@/features/business-settings/api/business-settings.server";
import { BusinessSettingsForm } from "@/features/business-settings/components/business-settings-form";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminBusinessSettingsPage() {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminBusinessSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <AdminPageHeader
          title="Business settings"
          description="Chính sách vận hành có version, áp dụng đồng nhất cho API và giao diện người dùng."
        />
        <BusinessSettingsForm
          initialSettings={settings}
          canUpdate={Boolean(currentUser.permissions?.includes("settings.update"))}
        />
      </div>
    </main>
  );
}
