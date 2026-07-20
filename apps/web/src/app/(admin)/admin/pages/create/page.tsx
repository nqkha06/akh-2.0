import { redirect } from "next/navigation";

import { PageEditor } from "@/features/admin-pages/components/page-editor";
import { requireAdmin } from "@/lib/auth/guards";

export default async function CreateAdminPage() {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("pages.create")) {
    redirect("/admin/pages");
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <PageEditor page={null} />
    </main>
  );
}
