import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminAppearanceSettings } from "@/features/site-settings/api/appearance.server";
import { AppearanceSettingsForm } from "@/features/site-settings/components/appearance-settings-form";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminAppearanceSettingsPage() {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminAppearanceSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Website Settings"
        description="Quản lý thông tin chung, nhận diện, mạng xã hội và liên hệ công khai."
      />
      <AppearanceSettingsForm
        initialSettings={settings}
        canUpdate={Boolean(currentUser.permissions?.includes("settings.update"))}
      />
    </main>
  );
}
