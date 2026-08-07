import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAdminPage } from "@/features/admin-pages/api/pages.server";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
import { PublicPageContent } from "@/features/pages/components/public-page-content";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPagePreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("pages.read")) redirect("/admin");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const page = await getAdminPage(id);
  if (!page) notFound();
  const canEdit =
    currentUser.permissions.includes("pages.update") &&
    page.status !== "ARCHIVED";

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <PageStatusBadge status={page.status} />
            <span className="text-sm text-muted-foreground">
              Bản xem trước dành cho quản trị viên
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/pages/${page.id}`}>
                <ArrowLeft /> Chi tiết
              </Link>
            </Button>
            {canEdit ? (
              <Button asChild>
                <Link href={`/admin/pages/${page.id}/edit`}>
                  <Pencil /> Chỉnh sửa
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12 lg:px-8">
          <PublicPageContent page={page} />
        </div>
      </main>
  );
}
