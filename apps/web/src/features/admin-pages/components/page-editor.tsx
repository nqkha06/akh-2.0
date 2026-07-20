"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  Loader2,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { ManagedImagePicker } from "@/components/media/managed-image-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  createAdminPage,
  updateAdminPage,
  updateAdminPageStatus,
} from "@/features/admin-pages/api/pages.client";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
import {
  emptyTiptapDocument,
  pageFormSchema,
  type PageFormValues,
  slugifyPageTitle,
} from "@/features/admin-pages/schemas/page-schema";
import { pageStatusConfig } from "@/features/admin-pages/page-status";
import type {
  AdminPage,
  AdminPagePayload,
  PageStatus,
} from "@/features/admin-pages/types";

export function PageEditor({ page }: { page: AdminPage | null }) {
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canPublish = permissions.includes("pages.publish");
  const [saving, setSaving] = React.useState(false);
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const [slugEdited, setSlugEdited] = React.useState(Boolean(page));
  const [selectedStatus, setSelectedStatus] = React.useState<PageStatus>(
    page?.status ?? "DRAFT",
  );
  const [savedStatus, setSavedStatus] = React.useState<PageStatus>(
    page?.status ?? "DRAFT",
  );
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: getDefaultValues(page),
    mode: "onBlur",
  });
  const [title, featuredImageId] = useWatch({
    control: form.control,
    name: ["title", "featuredImageId"],
  });
  const hasChanges =
    form.formState.isDirty || selectedStatus !== savedStatus;

  React.useEffect(() => {
    if (!slugEdited) {
      form.setValue("slug", slugifyPageTitle(title), {
        shouldDirty: Boolean(title),
        shouldValidate: false,
      });
    }
  }, [form, slugEdited, title]);

  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    if (
      hasChanges &&
      !saving &&
      !window.confirm("Bạn có thay đổi chưa lưu. Vẫn rời khỏi trang?")
    ) {
      return;
    }
    router.push("/admin/pages");
  }

  async function save(values: PageFormValues, targetStatus: PageStatus) {
    if (targetStatus === "PUBLISHED" && !canPublish) {
      toast.error("Bạn không có quyền xuất bản trang.");
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(values, targetStatus);
      if (!page) {
        const created = await createAdminPage(payload);
        toast.success(
          created.status === "PUBLISHED"
            ? "Đã tạo và xuất bản trang."
            : "Đã tạo trang.",
        );
        router.replace(`/admin/pages/${created.id}/edit`);
        router.refresh();
        return;
      }

      await updateAdminPage(page.id, payload);
      if (targetStatus !== savedStatus) {
        await updateAdminPageStatus(page.id, targetStatus);
      }
      form.reset(values);
      setSelectedStatus(targetStatus);
      setSavedStatus(targetStatus);
      toast.success("Đã cập nhật trang.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu trang.",
      );
    } finally {
      setSaving(false);
    }
  }

  const persist = form.handleSubmit((values) => save(values, selectedStatus));

  function persistAs(status: PageStatus) {
    void form.handleSubmit((values) => save(values, status))();
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={persist}
          className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-6"
        >
          <AdminPageHeader
            title={page ? `Chỉnh sửa ${page.title}` : "Tạo Page"}
            description="Soạn nội dung, cài đặt hiển thị và metadata SEO trong cùng một màn hình."
            meta={<PageStatusBadge status={selectedStatus} />}
            breadcrumbs={
              page
                ? [
                    { label: "Dashboard", href: "/admin" },
                    { label: "Pages", href: "/admin/pages" },
                    {
                      label: page.title,
                      href: `/admin/pages/${page.id}`,
                    },
                    { label: "Chỉnh sửa" },
                  ]
                : undefined
            }
            leading={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Quay lại danh sách Pages"
                onClick={leaveEditor}
              >
                <ArrowLeft />
              </Button>
            }
            actions={
              <>
                {page ? (
                  <Button variant="outline" asChild>
                    <Link
                      href={`/admin/pages/${page.id}/preview`}
                      target="_blank"
                    >
                      <Eye /> Preview
                    </Link>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => persistAs("DRAFT")}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  Lưu nháp
                </Button>
                {page ? (
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={saving || !hasChanges}
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Cập nhật
                  </Button>
                ) : null}
                {canPublish ? (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => persistAs("PUBLISHED")}
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Send />}
                    {page ? "Cập nhật & xuất bản" : "Xuất bản"}
                  </Button>
                ) : !page ? (
                  <Button type="submit" disabled={saving || !hasChanges}>
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Cập nhật
                  </Button>
                ) : null}
              </>
            }
          />

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nội dung</CardTitle>
                  <CardDescription>
                    Title và slug định danh trang; editor lưu đồng thời Tiptap
                    JSON và HTML đã được Backend sanitize.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoFocus={!page}
                            placeholder="Ví dụ: Chính sách bảo mật"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <div className="flex rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
                            <span className="flex items-center border-r px-3 font-mono text-muted-foreground text-sm">
                              /
                            </span>
                            <Input
                              {...field}
                              className="border-0 font-mono shadow-none focus-visible:ring-0"
                              placeholder="chinh-sach-bao-mat"
                              onChange={(event) => {
                                setSlugEdited(true);
                                field.onChange(
                                  slugifyPageTitle(event.target.value),
                                );
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Tự tạo từ title cho đến khi bạn chỉnh slug thủ công.
                          Backend sẽ chuẩn hóa và kiểm tra trùng.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả ngắn</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Tóm tắt nội dung trang..."
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value.length}/500 ký tự
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contentJson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nội dung trang</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            disabled={saving}
                            onChange={({ json, html }) => {
                              field.onChange(json);
                              form.setValue("contentHtml", html, {
                                shouldDirty: true,
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                  <CardDescription>
                    Metadata cho search engine và quy tắc index/follow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Mặc định dùng title của trang"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormDescription>
                          {field.value.length}/320 ký tự
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seoKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="privacy, security, policy"
                          />
                        </FormControl>
                        <FormDescription>
                          Phân tách từ khóa bằng dấu phẩy.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canonical URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://example.com/page"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <BooleanField
                      control={form.control}
                      name="robotsIndex"
                      label="Robots index"
                      description="Cho phép search engine lập chỉ mục."
                    />
                    <BooleanField
                      control={form.control}
                      name="robotsFollow"
                      label="Robots follow"
                      description="Cho phép crawler theo liên kết."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái</CardTitle>
                  <CardDescription>
                    Chọn vòng đời hiện tại của trang.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={selectedStatus}
                    disabled={saving}
                    onValueChange={(value) =>
                      setSelectedStatus(value as PageStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map(
                        (status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            disabled={status === "PUBLISHED" && !canPublish}
                          >
                            {pageStatusConfig[status].label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {pageStatusConfig[selectedStatus].description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Featured image</CardTitle>
                  <CardDescription>
                    Chọn ảnh public từ Media Manager hiện tại.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {featuredImageId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/backend/files/${featuredImageId}/download?disposition=inline`}
                      alt="Featured image"
                      className="aspect-video w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="grid aspect-video place-items-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setImagePickerOpen(true)}
                  >
                    <ImageIcon /> Chọn ảnh
                  </Button>
                  {featuredImageId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() =>
                        form.setValue("featuredImageId", null, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <Trash2 /> Bỏ ảnh
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt</CardTitle>
                  <CardDescription>
                    Thứ tự dùng khi hiển thị danh sách Pages.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.valueAsNumber || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </Form>

      <ManagedImagePicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        selectedFileId={featuredImageId}
        title="Chọn featured image"
        onSelect={(file) =>
          form.setValue("featuredImageId", file.id, {
            shouldDirty: true,
          })
        }
      />
    </>
  );
}

function BooleanField({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useForm<PageFormValues>>["control"];
  name: "robotsIndex" | "robotsFollow";
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function getDefaultValues(page: AdminPage | null): PageFormValues {
  return {
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    excerpt: page?.excerpt ?? "",
    contentJson: page?.contentJson ?? emptyTiptapDocument,
    contentHtml: page?.contentHtml ?? "",
    featuredImageId: page?.featuredImageId ?? null,
    seoTitle: page?.seoTitle ?? "",
    seoDescription: page?.seoDescription ?? "",
    seoKeywords: page?.seoKeywords ?? "",
    canonicalUrl: page?.canonicalUrl ?? "",
    robotsIndex: page?.robotsIndex ?? true,
    robotsFollow: page?.robotsFollow ?? true,
    sortOrder: page?.sortOrder ?? 0,
  };
}

function toPayload(
  values: PageFormValues,
  status: PageStatus,
): AdminPagePayload {
  const nullable = (value: string) => value.trim() || null;
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: nullable(values.excerpt),
    contentJson: values.contentJson,
    contentHtml: values.contentHtml,
    featuredImageId: values.featuredImageId,
    seoTitle: nullable(values.seoTitle),
    seoDescription: nullable(values.seoDescription),
    seoKeywords: nullable(values.seoKeywords),
    canonicalUrl: nullable(values.canonicalUrl),
    robotsIndex: values.robotsIndex,
    robotsFollow: values.robotsFollow,
    sortOrder: values.sortOrder,
    status,
  };
}
