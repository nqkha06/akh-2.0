import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSupportTickets } from "@/features/admin-support/components/admin-support-tickets";

export const metadata: Metadata = {
  title: "Hỗ trợ member",
};

export default function AdminSupportPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Hỗ trợ member"
        description="Tiếp nhận, phân công và phản hồi ticket hỗ trợ của thành viên."
      />
      <AdminSupportTickets />
    </main>
  );
}
