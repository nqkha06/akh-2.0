"use client";

import * as React from "react";
import Link from "next/link";
import { BUNDLED_UI_LOCALES } from "@stu/contracts";
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Languages,
  Info,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { publicationStatusLabel } from "@/types/publication-status";

import {
  deleteLanguage,
  getAdminLanguages,
  reorderLanguages,
  setDefaultLanguage,
} from "../api/languages.client";
import type { Language } from "../types";

export function AdminLanguagesPage() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("languages.create");
  const canUpdate = permissions.includes("languages.update");
  const canDelete = permissions.includes("languages.delete");
  const [items, setItems] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deleting, setDeleting] = React.useState<Language | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await getAdminLanguages()).items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải ngôn ngữ.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void getAdminLanguages()
      .then((result) => {
        if (active) setItems(result.items);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải ngôn ngữ.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function mutate(
    language: Language,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusyId(language.id);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật ngôn ngữ.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function move(language: Language, direction: -1 | 1) {
    const index = items.findIndex(({ id }) => id === language.id);
    const target = items[index + direction];
    if (!target) return;
    await mutate(
      language,
      () =>
        reorderLanguages([
          { id: language.id, sortOrder: target.sortOrder },
          { id: target.id, sortOrder: language.sortOrder },
        ]),
      "Đã cập nhật thứ tự.",
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-8">
      <AdminPageHeader
        title="Ngôn ngữ"
        description="Quản lý locale cho nội dung và giao diện member từ một nơi duy nhất."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/admin/languages/create">
                <Plus />
                Thêm ngôn ngữ
              </Link>
            </Button>
          ) : null
        }
      />
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle>Ngôn ngữ đã publish sẽ xuất hiện cho member</AlertTitle>
        <AlertDescription>
          Tiếng Việt và English có sẵn toàn bộ bản dịch. Với locale mới, key chưa
          dịch sẽ fallback sang English để giao diện luôn hoạt động.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 rounded-2xl border bg-card text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Đang tải danh mục...
        </div>
      ) : error ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw />
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-6 text-center">
          <Languages className="size-9 text-muted-foreground" />
          <p className="mt-4 font-medium">Chưa có ngôn ngữ</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((language, index) => (
            <Card
              key={language.id}
              className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none"
            >
              <CardHeader className="border-b px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl border bg-muted/30 text-2xl">
                      {countryFlag(language.flag)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold tracking-tight">
                        {language.nativeName || language.name}
                      </h2>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {language.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {language.isDefault ? (
                      <Badge variant="secondary">
                        <Star />
                        Mặc định
                      </Badge>
                    ) : null}
                    <Badge
                      variant={
                        language.status === "published"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {publicationStatusLabel(language.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 py-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Meta label="Locale" value={language.locale} mono />
                  <Meta label="Regional" value={language.regional || "—"} mono />
                  <Meta label="Direction" value={language.isRtl ? "RTL" : "LTR"} />
                  <Meta label="Thứ tự" value={String(language.sortOrder)} />
                </dl>

                <UiTranslationProgress language={language} />

                {canUpdate ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/languages/${language.id}/translations`}>
                      <BookOpenText />
                      Dịch giao diện member
                    </Link>
                  </Button>
                ) : null}

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Đưa lên"
                      disabled={!canUpdate || index === 0 || busyId !== null}
                      onClick={() => void move(language, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Đưa xuống"
                      disabled={
                        !canUpdate ||
                        index === items.length - 1 ||
                        busyId !== null
                      }
                      onClick={() => void move(language, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {canUpdate && !language.isDefault ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Đặt mặc định"
                        disabled={busyId !== null}
                        onClick={() =>
                          void mutate(
                            language,
                            () => setDefaultLanguage(language.id),
                            `Đã đặt ${language.nativeName || language.name} làm mặc định.`,
                          )
                        }
                      >
                        <Star />
                      </Button>
                    ) : null}
                    {canUpdate ? (
                      <Button asChild size="icon" variant="ghost">
                        <Link
                          href={`/admin/languages/${language.id}/edit`}
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil />
                        </Link>
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Xóa"
                        disabled={language.isDefault}
                        onClick={() => setDeleting(language)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteLanguageDialog
        language={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}

function UiTranslationProgress({ language }: { language: Language }) {
  const bundled = BUNDLED_UI_LOCALES.includes(
    language.locale as (typeof BUNDLED_UI_LOCALES)[number],
  );
  const total = bundled
    ? Math.max(language.uiTranslation?.catalogSize ?? 0, 1)
    : (language.uiTranslation?.catalogSize ?? 0);
  const translated = bundled
    ? total
    : (language.uiTranslation?.translatedKeys ?? 0);
  const percentage = total ? Math.round((translated / total) * 100) : 0;
  return (
    <div className="space-y-2 rounded-xl border bg-muted/15 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">Bản dịch giao diện</span>
        <span className="text-muted-foreground">
          {bundled ? "Tích hợp sẵn" : `${translated}/${total || "—"} key`}
        </span>
      </div>
      <Progress value={percentage} />
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/15 px-3 py-2.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function DeleteLanguageDialog({
  language,
  onOpenChange,
  onDeleted,
}: {
  language: Language | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);

  async function remove() {
    if (!language) return;
    setBusy(true);
    try {
      await deleteLanguage(language.id);
      toast.success("Đã xóa ngôn ngữ.");
      onOpenChange(false);
      onDeleted();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa ngôn ngữ.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={Boolean(language)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa ngôn ngữ?</AlertDialogTitle>
          <AlertDialogDescription>
            Chỉ ngôn ngữ chưa có bản dịch liên quan mới có thể xóa. Với ngôn
            ngữ đã sử dụng, hãy chuyển sang trạng thái tắt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            {busy ? "Đang xóa..." : "Xóa ngôn ngữ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function countryFlag(code: string | null) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(
    ...[...code].map((character) => 127397 + character.charCodeAt(0)),
  );
}
