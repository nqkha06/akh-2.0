import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminLinkReports } from "@/features/admin-link-reports/components/admin-link-reports";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Báo cáo liên kết",
};

export default async function AdminLinkReportsPage() {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("link-reports.read")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Báo cáo liên kết"
        description="Kiểm tra và xử lý báo cáo lạm dụng được gửi từ giao diện public."
      />
      <AdminLinkReports />
    </main>
  );
}
