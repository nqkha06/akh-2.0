"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Languages,
  LoaderCircle,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  getUiTranslations,
  updateUiTranslations,
} from "../api/languages.client";
import type { UiTranslationsResponse } from "../types";
import {
  bundledMessagesFor,
  uiMessageCatalog,
} from "../ui-message-catalog";

const PAGE_SIZE = 40;
type TranslationFilter = "all" | "missing" | "translated";

export function UiTranslationsEditor({ languageId }: { languageId: number }) {
  const [data, setData] = React.useState<UiTranslationsResponse | null>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [namespace, setNamespace] = React.useState("all");
  const [filter, setFilter] = React.useState<TranslationFilter>("all");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let active = true;
    void getUiTranslations(languageId)
      .then((result) => {
        if (!active) return;
        const bundled = bundledMessagesFor(result.language.locale) ?? {};
        const nextValues = { ...bundled, ...result.messages };
        setData(result);
        setValues(nextValues);
        setSavedValues(nextValues);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải bản dịch giao diện.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [languageId]);

  const dirty = React.useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedValues),
    [savedValues, values],
  );

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const namespaces = React.useMemo(
    () => [...new Set(uiMessageCatalog.map((item) => item.namespace))],
    [],
  );
  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return uiMessageCatalog.filter((item) => {
      const value = values[item.key]?.trim() || "";
      if (namespace !== "all" && item.namespace !== namespace) return false;
      if (filter === "missing" && value) return false;
      if (filter === "translated" && !value) return false;
      return (
        !normalizedQuery ||
        item.key.toLowerCase().includes(normalizedQuery) ||
        item.english.toLowerCase().includes(normalizedQuery) ||
        item.vietnamese.toLowerCase().includes(normalizedQuery) ||
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, namespace, query, values]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const translatedKeys = uiMessageCatalog.reduce(
    (count, item) => count + (values[item.key]?.trim() ? 1 : 0),
    0,
  );
  const completion = Math.round(
    (translatedKeys / Math.max(1, uiMessageCatalog.length)) * 100,
  );

  async function save() {
    if (!data) return;
    setSaving(true);
    setError("");
    try {
      const bundled = bundledMessagesFor(data.language.locale);
      const nextOverrides = Object.fromEntries(uiMessageCatalog.flatMap(({ key }) => {
        const value = values[key] || "";
        if (!value.trim() || (bundled && value === bundled[key])) return [];
        return [[key, value]];
      })) as Record<string, string>;
      const entries = Object.entries(nextOverrides)
        .filter(([key, value]) => data.messages[key] !== value)
        .map(([key, value]) => ({ key, value }));
      const removedKeys = Object.keys(data.messages).filter(
        (key) => nextOverrides[key] === undefined,
      );
      const result = await updateUiTranslations(languageId, {
        version: data.version,
        catalogSize: uiMessageCatalog.length,
        entries,
        removedKeys,
      });
      const nextValues = {
        ...(bundledMessagesFor(result.language.locale) ?? {}),
        ...result.messages,
      };
      setData(result);
      setValues(nextValues);
      setSavedValues(nextValues);
      toast.success("Đã lưu bản dịch giao diện.");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu bản dịch giao diện.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-72 w-full max-w-[1240px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Đang tải kho bản dịch...
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <Languages />
        <AlertTitle>Không thể mở kho bản dịch</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-10">
      <AdminPageHeader
        title={`Bản dịch UI · ${data.language.nativeName || data.language.name}`}
        description="Dịch giao diện member theo từng key. Key chưa dịch tự động dùng English để trang luôn hoạt động."
        leading={
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/languages">
              <ArrowLeft />
            </Link>
          </Button>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || saving}
              onClick={() => setValues(savedValues)}
            >
              <RotateCcw />
              Hoàn tác
            </Button>
            <Button disabled={!dirty || saving} onClick={() => void save()}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {saving ? "Đang lưu..." : "Lưu bản dịch"}
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <Languages />
          <AlertTitle>Không thể lưu thay đổi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="gap-0 rounded-2xl py-0 shadow-none">
          <CardContent className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm key hoặc nội dung..."
                className="pl-9"
              />
            </div>
            <select
              aria-label="Nhóm bản dịch"
              value={namespace}
              onChange={(event) => {
                setNamespace(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="all">Tất cả nhóm</option>
              {namespaces.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              aria-label="Trạng thái bản dịch"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as TranslationFilter);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="missing">Chưa dịch</option>
              <option value="translated">Đã dịch</option>
            </select>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-2xl py-0 shadow-none">
          <CardContent className="px-5 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Độ hoàn thiện</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{completion}%</p>
              </div>
              <Badge variant={completion === 100 ? "secondary" : "outline"}>
                {translatedKeys}/{uiMessageCatalog.length}
              </Badge>
            </div>
            <Progress value={completion} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {completion < 100 ? (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Fallback đang được bật</AlertTitle>
          <AlertDescription>
            Member vẫn có thể chọn {data.language.nativeName || data.language.name}; các key còn thiếu sẽ hiển thị bằng English.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none">
        <CardHeader className="border-b px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Translation keys</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length} kết quả · trang {page}/{totalPages}
              </p>
            </div>
            {dirty ? <Badge variant="secondary">Chưa lưu</Badge> : <Badge variant="outline">Đã đồng bộ</Badge>}
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {visible.length ? visible.map((item) => {
            const value = values[item.key] || "";
            return (
              <div key={item.key} className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
                <div className="min-w-0">
                  <p className="break-all font-mono text-xs font-medium text-primary">{item.key}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{item.english}</p>
                  {item.vietnamese && data.language.locale !== "vi" ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">VI: {item.vietnamese}</p>
                  ) : null}
                </div>
                <div>
                  <Textarea
                    aria-label={`Bản dịch ${item.key}`}
                    value={value}
                    rows={Math.min(5, Math.max(2, Math.ceil(value.length / 72)))}
                    placeholder="Nhập bản dịch..."
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [item.key]: event.target.value,
                      }))
                    }
                  />
                  <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                    <span>{value.trim() ? "Đã dịch" : "Đang dùng English"}</span>
                    <span>{value.length}/10.000</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              Không có translation key phù hợp bộ lọc.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Hiển thị {visible.length} trong {filtered.length} key
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            <ChevronLeft /> Trước
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
            Sau <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
