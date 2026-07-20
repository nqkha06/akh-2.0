import { ArrowLeft, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminPage } from "@/features/admin-pages/api/pages.server";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPageDetail({
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
    <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={page.title}
        description={<span className="font-mono">/{page.slug}</span>}
        meta={<PageStatusBadge status={page.status} />}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pages", href: "/admin/pages" },
          { label: page.title },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/pages">
                <ArrowLeft /> Danh sách
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/pages/${page.id}/preview`}>
                <Eye /> Preview
              </Link>
            </Button>
            {canEdit ? (
              <Button asChild>
                <Link href={`/admin/pages/${page.id}/edit`}>
                  <Pencil /> Chỉnh sửa
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Nội dung</CardTitle>
          </CardHeader>
          <CardContent>
            {page.excerpt ? (
              <p className="mb-6 border-l-4 pl-4 text-muted-foreground">
                {page.excerpt}
              </p>
            ) : null}
            <article
              className="max-w-none leading-7 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:gap-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0"
              dangerouslySetInnerHTML={{ __html: page.contentHtml }}
            />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <InfoCard
            title="Thời gian"
            rows={[
              ["Tạo", formatDate(page.createdAt)],
              ["Cập nhật", formatDate(page.updatedAt)],
              [
                "Xuất bản lần đầu",
                page.publishedAt ? formatDate(page.publishedAt) : "—",
              ],
            ]}
          />
          <InfoCard
            title="SEO"
            rows={[
              ["SEO title", page.seoTitle || "—"],
              ["Description", page.seoDescription || "—"],
              ["Keywords", page.seoKeywords || "—"],
              ["Canonical", page.canonicalUrl || "—"],
              [
                "Robots",
                `${page.robotsIndex ? "index" : "noindex"}, ${page.robotsFollow ? "follow" : "nofollow"}`,
              ],
            ]}
          />
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 break-words text-sm">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
