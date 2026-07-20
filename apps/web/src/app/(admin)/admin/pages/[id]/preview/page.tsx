import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAdminPage } from "@/features/admin-pages/api/pages.server";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
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
          <article className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {page.featuredImageId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/backend/files/${page.featuredImageId}/download?disposition=inline`}
                alt={page.featuredImage?.name || ""}
                className="aspect-[16/7] w-full object-cover"
              />
            ) : null}
            <div className="px-5 py-8 sm:px-10 sm:py-12">
              <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
                {page.title}
              </h1>
              {page.excerpt ? (
                <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                  {page.excerpt}
                </p>
              ) : null}
              <div className="my-8 h-px bg-border" />
              <div
                className="max-w-none leading-7 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_hr]:my-8 [&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-lg [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:gap-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_pre]:my-5 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0"
                dangerouslySetInnerHTML={{ __html: page.contentHtml }}
              />
            </div>
          </article>
        </div>
      </main>
  );
}
