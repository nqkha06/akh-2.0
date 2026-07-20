import { notFound, redirect } from "next/navigation";

import { getAdminPage } from "@/features/admin-pages/api/pages.server";
import { PageEditor } from "@/features/admin-pages/components/page-editor";
import { requireAdmin } from "@/lib/auth/guards";

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("pages.update")) {
    redirect("/admin/pages");
  }
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const page = await getAdminPage(id);
  if (!page) notFound();
  if (page.status === "ARCHIVED") redirect(`/admin/pages/${page.id}`);

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <PageEditor page={page} />
    </main>
  );
}
