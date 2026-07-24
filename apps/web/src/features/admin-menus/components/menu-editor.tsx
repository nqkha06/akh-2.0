"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  GripVertical,
  Link2,
  LoaderCircle,
  Menu,
  PanelRight,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  getMenu,
  getMenuEditorOptions,
  publishMenu,
  saveMenuTree,
  updateMenu,
} from "../api/menus.client";
import type {
  LanguageOption,
  PageOption,
  WebsiteMenu,
  WebsiteMenuItem,
  WebsiteMenuItemType,
} from "../types";

let nextTemporaryId = -1;

export function MenuEditor({ menuId }: { menuId: number }) {
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canUpdate = permissions.includes("menus.update");
  const canPublish = permissions.includes("menus.publish");
  const [menu, setMenu] = React.useState<WebsiteMenu | null>(null);
  const [items, setItems] = React.useState<WebsiteMenuItem[]>([]);
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);
  const [pages, setPages] = React.useState<PageOption[]>([]);
  const [locale, setLocale] = React.useState("vi");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuResult, options] = await Promise.all([
        getMenu(menuId),
        getMenuEditorOptions(),
      ]);
      setMenu(menuResult);
      setItems(menuResult.items);
      setLanguages(options.languages.filter((item) => item.status === "published"));
      setPages(options.pages);
      setLocale(
        options.languages.find((item) => item.isDefault)?.locale ??
          options.languages[0]?.locale ??
          "vi",
      );
      setSelectedId(menuResult.items[0]?.id ?? null);
      setDirty(false);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải trình dựng menu.",
      );
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  React.useEffect(() => {
    let active = true;
    void Promise.all([getMenu(menuId), getMenuEditorOptions()])
      .then(([menuResult, options]) => {
        if (!active) return;
        setMenu(menuResult);
        setItems(menuResult.items);
        setLanguages(
          options.languages.filter((item) => item.status === "published"),
        );
        setPages(options.pages);
        setLocale(
          options.languages.find((item) => item.isDefault)?.locale ??
            options.languages[0]?.locale ??
            "vi",
        );
        setSelectedId(menuResult.items[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải trình dựng menu.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [menuId]);

  const selected = selectedId === null ? null : findItem(items, selectedId);

  function updateItems(next: WebsiteMenuItem[]) {
    setItems(next);
    setDirty(true);
  }

  function updateSelected(patch: Partial<WebsiteMenuItem>) {
    if (selectedId === null) return;
    updateItems(mapItem(items, selectedId, (item) => ({ ...item, ...patch })));
  }

  function updateTranslation(
    translationPatch: Partial<WebsiteMenuItem["translations"][number]>,
  ) {
    if (!selected) return;
    const current = selected.translations.find(
      (translation) => translation.locale === locale,
    );
    const nextTranslation = {
      locale,
      label: "",
      title: null,
      ariaLabel: null,
      urlOverride: null,
      ...current,
      ...translationPatch,
    };
    updateSelected({
      translations: current
        ? selected.translations.map((translation) =>
            translation.locale === locale ? nextTranslation : translation,
          )
        : [...selected.translations, nextTranslation],
    });
  }

  function addItem(parentId: number | null = null) {
    const defaultLocale =
      languages.find((language) => language.isDefault)?.locale ??
      languages[0]?.locale ??
      "vi";
    const item = createEmptyItem(defaultLocale);
    updateItems(
      parentId === null
        ? [...items, item]
        : mapItem(items, parentId, (parent) => ({
            ...parent,
            children: [...parent.children, item],
          })),
    );
    setSelectedId(item.id);
  }

  function removeSelected() {
    if (selectedId === null) return;
    updateItems(removeItem(items, selectedId));
    setSelectedId(null);
  }

  async function save() {
    if (!menu) return;
    setSaving(true);
    try {
      const result = await saveMenuTree(menu.id, menu.draftVersion, items);
      setMenu(result);
      setItems(result.items);
      setSelectedId((current) =>
        current && current > 0 ? current : result.items[0]?.id ?? null,
      );
      setDirty(false);
      toast.success("Đã lưu bản nháp menu.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "Không thể lưu menu.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveMetadata() {
    if (!menu) return;
    setSaving(true);
    try {
      const result = await updateMenu(menu.id, {
        name: menu.name,
        description: menu.description ?? "",
        translations: menu.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title ?? "",
        })),
      });
      setMenu(result);
      toast.success("Đã lưu thông tin menu.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu thông tin.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!menu) return;
    setPublishing(true);
    try {
      let current = menu;
      if (dirty) {
        current = await saveMenuTree(menu.id, menu.draftVersion, items);
        setItems(current.items);
        setDirty(false);
      }
      const result = await publishMenu(current.id);
      setMenu(result);
      setItems(result.items);
      toast.success("Menu đã được xuất bản.");
    } catch (publishError) {
      toast.error(
        publishError instanceof Error
          ? publishError.message
          : "Không thể xuất bản menu.",
      );
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <StatePanel>
        <LoaderCircle className="size-5 animate-spin" />
        Đang tải trình dựng menu...
      </StatePanel>
    );
  }
  if (error || !menu) {
    return (
      <StatePanel>
        <p className="text-destructive">{error || "Không tìm thấy menu."}</p>
        <Button variant="outline" onClick={() => void load()}>
          Thử lại
        </Button>
      </StatePanel>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-8">
      <AdminPageHeader
        title={menu.name}
        description="Kéo để sắp xếp trong cùng một cấp, chọn một mục để chỉnh nội dung và bản dịch."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Website Menus", href: "/admin/menus" },
          { label: menu.name },
        ]}
        meta={
          <>
            <Badge
              variant={menu.status === "published" ? "default" : "secondary"}
            >
              {menu.status === "published" ? "Đã xuất bản" : "Bản nháp"}
            </Badge>
            {dirty || menu.isDirty ? (
              <Badge variant="outline">Có thay đổi</Badge>
            ) : null}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/admin/menus")}>
              Danh sách
            </Button>
            {canUpdate ? (
              <Button
                variant="outline"
                disabled={!dirty || saving}
                onClick={() => void save()}
              >
                {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
                Lưu nháp
              </Button>
            ) : null}
            {canPublish ? (
              <Button disabled={publishing} onClick={() => void publish()}>
                {publishing ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Send />
                )}
                Xuất bản
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="gap-0 rounded-xl shadow-none">
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <div className="grid gap-2">
            <Label>Tên quản trị</Label>
            <Input
              disabled={!canUpdate}
              value={menu.name}
              onChange={(event) =>
                setMenu((current) =>
                  current ? { ...current, name: event.target.value } : current,
                )
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Mô tả</Label>
            <Input
              disabled={!canUpdate}
              value={menu.description ?? ""}
              onChange={(event) =>
                setMenu((current) =>
                  current
                    ? { ...current, description: event.target.value }
                    : current,
                )
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Tiêu đề menu · {locale}</Label>
            <Input
              disabled={!canUpdate}
              value={
                menu.translations.find(
                  (translation) => translation.locale === locale,
                )?.title ?? ""
              }
              onChange={(event) => {
                const existing = menu.translations.some(
                  (translation) => translation.locale === locale,
                );
                setMenu({
                  ...menu,
                  translations: existing
                    ? menu.translations.map((translation) =>
                        translation.locale === locale
                          ? { ...translation, title: event.target.value }
                          : translation,
                      )
                    : [
                        ...menu.translations,
                        { locale, title: event.target.value },
                      ],
                });
              }}
            />
          </div>
          <Button
            disabled={!canUpdate || saving}
            variant="outline"
            onClick={() => void saveMetadata()}
          >
            Lưu thông tin
          </Button>
        </CardContent>
      </Card>

      <div className="grid min-h-[640px] gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <Card className="gap-0 overflow-hidden rounded-xl shadow-none">
          <CardHeader className="flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-base">Cấu trúc menu</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Tối đa 3 cấp và 100 mục.
              </p>
            </div>
            {canUpdate ? (
              <Button size="sm" onClick={() => addItem()}>
                <Plus />
                Thêm mục
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[590px]">
              {items.length ? (
                <div className="p-3">
                  <MenuTree
                    items={items}
                    locale={locale}
                    selectedId={selectedId}
                    disabled={!canUpdate}
                    onChange={updateItems}
                    onSelect={setSelectedId}
                    onAddChild={addItem}
                  />
                </div>
              ) : (
                <div className="flex min-h-96 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
                  <Menu className="size-8" />
                  Menu chưa có mục nào.
                  {canUpdate ? (
                    <Button variant="outline" onClick={() => addItem()}>
                      Thêm mục đầu tiên
                    </Button>
                  ) : null}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-xl shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <PanelRight className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Thuộc tính mục</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {selected ? (
              <ScrollArea className="h-[590px]">
                <div className="space-y-5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="grid gap-1">
                      <Label>Hiển thị mục này</Label>
                      <span className="text-xs text-muted-foreground">
                        Mục tắt không đi vào snapshot publish.
                      </span>
                    </div>
                    <Switch
                      checked={selected.isEnabled}
                      disabled={!canUpdate}
                      onCheckedChange={(checked) =>
                        updateSelected({ isEnabled: checked })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Loại liên kết</Label>
                    <Select
                      disabled={!canUpdate}
                      value={selected.type}
                      onValueChange={(value) =>
                        updateSelected({
                          type: value as WebsiteMenuItemType,
                          pageId: value === "PAGE" ? selected.pageId : null,
                          url:
                            value === "CUSTOM_URL" || value === "ANCHOR"
                              ? selected.url
                              : null,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOM_URL">URL tùy chỉnh</SelectItem>
                        <SelectItem value="PAGE">Trang nội dung</SelectItem>
                        <SelectItem value="ANCHOR">Anchor trong trang</SelectItem>
                        <SelectItem value="GROUP">Nhóm liên kết</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selected.type === "PAGE" ? (
                    <div className="grid gap-2">
                      <Label>Trang đích</Label>
                      <Select
                        disabled={!canUpdate}
                        value={selected.pageId?.toString()}
                        onValueChange={(value) =>
                          updateSelected({ pageId: Number(value) })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn trang" />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map((page) => (
                            <SelectItem key={page.id} value={page.id.toString()}>
                              {page.title} · /{page.slug}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : selected.type === "CUSTOM_URL" ||
                    selected.type === "ANCHOR" ? (
                    <div className="grid gap-2">
                      <Label>
                        {selected.type === "ANCHOR" ? "Anchor" : "URL"}
                      </Label>
                      <Input
                        disabled={!canUpdate}
                        placeholder={
                          selected.type === "ANCHOR"
                            ? "#features"
                            : "/about hoặc https://..."
                        }
                        value={selected.url ?? ""}
                        onChange={(event) =>
                          updateSelected({ url: event.target.value })
                        }
                      />
                    </div>
                  ) : null}

                  {selected.type !== "GROUP" ? (
                    <div className="grid gap-2">
                      <Label>Mở liên kết</Label>
                      <Select
                        disabled={!canUpdate}
                        value={selected.target}
                        onValueChange={(value) =>
                          updateSelected({
                            target: value as "SELF" | "BLANK",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SELF">Cùng cửa sổ</SelectItem>
                          <SelectItem value="BLANK">Tab mới</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="border-t pt-5">
                    <Tabs value={locale} onValueChange={setLocale}>
                      <TabsList className="max-w-full overflow-x-auto">
                        {languages.map((language) => (
                          <TabsTrigger
                            key={language.locale}
                            value={language.locale}
                          >
                            {language.nativeName || language.locale}
                            {language.isDefault ? " *" : ""}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-2">
                    <Label>Nhãn hiển thị</Label>
                    <Input
                      disabled={!canUpdate}
                      maxLength={100}
                      value={
                        selected.translations.find(
                          (translation) => translation.locale === locale,
                        )?.label ?? ""
                      }
                      onChange={(event) =>
                        updateTranslation({ label: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Title / tooltip</Label>
                    <Input
                      disabled={!canUpdate}
                      maxLength={160}
                      value={
                        selected.translations.find(
                          (translation) => translation.locale === locale,
                        )?.title ?? ""
                      }
                      onChange={(event) =>
                        updateTranslation({ title: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>ARIA label</Label>
                    <Input
                      disabled={!canUpdate}
                      maxLength={160}
                      value={
                        selected.translations.find(
                          (translation) => translation.locale === locale,
                        )?.ariaLabel ?? ""
                      }
                      onChange={(event) =>
                        updateTranslation({ ariaLabel: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>URL riêng cho locale</Label>
                    <Input
                      disabled={!canUpdate}
                      placeholder="Để trống để dùng URL chung"
                      value={
                        selected.translations.find(
                          (translation) => translation.locale === locale,
                        )?.urlOverride ?? ""
                      }
                      onChange={(event) =>
                        updateTranslation({ urlOverride: event.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2 border-t pt-5 sm:grid-cols-2">
                    <Button
                      disabled={!canUpdate}
                      variant="outline"
                      onClick={() => addItem(selected.id)}
                    >
                      <Plus />
                      Thêm mục con
                    </Button>
                    <Button
                      disabled={!canUpdate}
                      variant="destructive"
                      onClick={removeSelected}
                    >
                      <Trash2 />
                      Xóa mục
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex min-h-[440px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <PanelRight className="size-8" />
                Chọn một mục trong cây để chỉnh sửa.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MenuPreview items={items} locale={locale} />
    </div>
  );
}

function MenuTree({
  items,
  locale,
  selectedId,
  disabled,
  onChange,
  onSelect,
  onAddChild,
  depth = 0,
}: {
  items: WebsiteMenuItem[];
  locale: string;
  selectedId: number | null;
  disabled: boolean;
  onChange: (items: WebsiteMenuItem[]) => void;
  onSelect: (id: number) => void;
  onAddChild: (id: number) => void;
  depth?: number;
}) {
  return (
    <Sortable
      value={items}
      getItemValue={(item) => item.id}
      onValueChange={onChange}
    >
      <SortableContent className="space-y-2">
        {items.map((item) => {
          const translation =
            item.translations.find((entry) => entry.locale === locale) ??
            item.translations[0];
          return (
            <SortableItem disabled={disabled} key={item.id} value={item.id}>
              <div
                className={cn(
                  "rounded-lg border bg-card transition-colors",
                  selectedId === item.id
                    ? "border-primary/60 bg-primary/5"
                    : "hover:bg-muted/30",
                  !item.isEnabled && "opacity-60",
                )}
              >
                <div className="flex w-full items-center gap-2 p-2.5">
                  <SortableItemHandle asChild>
                    <span className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted">
                      <GripVertical className="size-4" />
                    </span>
                  </SortableItemHandle>

                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    type="button"
                    onClick={() => onSelect(item.id)}
                  >
                    {depth ? (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {translation?.label || "Mục chưa đặt tên"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.type === "PAGE"
                          ? item.page?.title || "Chưa chọn trang"
                          : item.type === "GROUP"
                            ? `${item.children.length} mục con`
                            : item.url || "Chưa nhập URL"}
                      </span>
                    </span>
                  </button>

                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {item.type}
                  </Badge>
                  {!disabled && depth < 2 ? (
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                      onClick={() => onAddChild(item.id)}
                    >
                      <Plus />
                      <span className="sr-only">Thêm mục con</span>
                    </Button>
                  ) : null}
                </div>
                {item.children.length ? (
                  <div className="border-t bg-muted/10 p-2 pl-5">
                    <MenuTree
                      depth={depth + 1}
                      disabled={disabled}
                      items={item.children}
                      locale={locale}
                      selectedId={selectedId}
                      onAddChild={onAddChild}
                      onChange={(children) =>
                        onChange(
                          items.map((candidate) =>
                            candidate.id === item.id
                              ? { ...candidate, children }
                              : candidate,
                          ),
                        )
                      }
                      onSelect={onSelect}
                    />
                  </div>
                ) : null}
              </div>
            </SortableItem>
          );
        })}
      </SortableContent>
    </Sortable>
  );
}

function MenuPreview({
  items,
  locale,
}: {
  items: WebsiteMenuItem[];
  locale: string;
}) {
  return (
    <Card className="gap-0 rounded-xl shadow-none">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Preview nhanh</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
          {items
            .filter((item) => item.isEnabled)
            .map((item) => (
              <span
                className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm"
                key={item.id}
              >
                {item.type === "GROUP" ? <Menu className="size-4" /> : <Link2 className="size-4" />}
                {item.translations.find(
                  (translation) => translation.locale === locale,
                )?.label ||
                  item.translations[0]?.label ||
                  "Chưa đặt tên"}
                {item.children.length ? (
                  <Badge variant="secondary">{item.children.length}</Badge>
                ) : null}
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-96 w-full max-w-[1240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function createEmptyItem(defaultLocale: string): WebsiteMenuItem {
  return {
    id: nextTemporaryId--,
    type: "CUSTOM_URL",
    pageId: null,
    url: "/",
    target: "SELF",
    rel: null,
    iconKey: null,
    isEnabled: true,
    translations: [
      {
        locale: defaultLocale,
        label: "Mục mới",
        title: null,
        ariaLabel: null,
        urlOverride: null,
      },
    ],
    page: null,
    children: [],
  };
}

function findItem(
  items: WebsiteMenuItem[],
  id: number,
): WebsiteMenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const child = findItem(item.children, id);
    if (child) return child;
  }
  return null;
}

function mapItem(
  items: WebsiteMenuItem[],
  id: number,
  mapper: (item: WebsiteMenuItem) => WebsiteMenuItem,
): WebsiteMenuItem[] {
  return items.map((item) =>
    item.id === id
      ? mapper(item)
      : { ...item, children: mapItem(item.children, id, mapper) },
  );
}

function removeItem(
  items: WebsiteMenuItem[],
  id: number,
): WebsiteMenuItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, children: removeItem(item.children, id) }));
}
