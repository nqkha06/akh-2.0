"use client";

import * as React from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import {
  assignMenuLocation,
  createMenu,
  deleteMenu,
  duplicateMenu,
  getMenuEditorOptions,
  getMenus,
  publishMenu,
  unpublishMenu,
  unassignMenuLocation,
} from "../api/menus.client";
import {
  websiteMenuLocations,
  type LanguageOption,
  type WebsiteMenu,
  type WebsiteMenuLocation,
} from "../types";

const locationLabels: Record<WebsiteMenuLocation, string> = {
  "header-primary": "Header chính",
  "header-actions": "Hành động header",
  "footer-primary": "Footer chính",
  "footer-legal": "Footer pháp lý",
  "footer-social": "Mạng xã hội footer",
  "mobile-primary": "Điều hướng mobile",
};

export function MenusPage() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("menus.create");
  const canUpdate = permissions.includes("menus.update");
  const canDelete = permissions.includes("menus.delete");
  const canPublish = permissions.includes("menus.publish");
  const canAssign = permissions.includes("menus.assign");
  const [menus, setMenus] = React.useState<WebsiteMenu[]>([]);
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuResponse, options] = await Promise.all([
        getMenus(),
        getMenuEditorOptions(),
      ]);
      setMenus(menuResponse.items);
      setLanguages(options.languages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải menu website.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void Promise.all([getMenus(), getMenuEditorOptions()])
      .then(([menuResponse, options]) => {
        if (!active) return;
        setMenus(menuResponse.items);
        setLanguages(options.languages);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải menu website.",
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
    menu: WebsiteMenu,
    action: () => Promise<unknown>,
    message: string,
  ) {
    setBusyId(menu.id);
    try {
      await action();
      toast.success(message);
      await load();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật menu.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function assign(location: WebsiteMenuLocation, menuId: string) {
    try {
      if (menuId === "none") {
        await unassignMenuLocation(location);
      } else {
        await assignMenuLocation(location, Number(menuId));
      }
      toast.success(`Đã cập nhật ${locationLabels[location]}.`);
      await load();
    } catch (assignmentError) {
      toast.error(
        assignmentError instanceof Error
          ? assignmentError.message
          : "Không thể gán vị trí.",
      );
    }
  }

  const assignedMenu = (location: WebsiteMenuLocation) =>
    menus.find((menu) =>
      menu.locations.some((item) => item.location === location),
    );

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-8">
      <AdminPageHeader
        title="Website Menus"
        description="Xây dựng điều hướng đa ngôn ngữ, kiểm soát bản nháp và chỉ đưa thay đổi ra website khi xuất bản."
        actions={
          <>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw />
              Làm mới
            </Button>
            {canCreate ? (
              <Button onClick={() => setCreating(true)}>
                <Plus />
                Tạo menu
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="gap-0 overflow-hidden rounded-xl shadow-none">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Vị trí hiển thị</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mỗi vị trí dùng một snapshot đã xuất bản. Một menu có thể được tái
            sử dụng ở nhiều vị trí.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {websiteMenuLocations.map((location) => (
            <div className="space-y-2" key={location}>
              <Label>{locationLabels[location]}</Label>
              <Select
                disabled={!canAssign || menus.length === 0}
                value={assignedMenu(location)?.id.toString()}
                onValueChange={(value) => void assign(location, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chưa gán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa gán</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {loading ? (
        <StatePanel>
          <LoaderCircle className="size-4 animate-spin" />
          Đang tải menu...
        </StatePanel>
      ) : error ? (
        <StatePanel>
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            Thử lại
          </Button>
        </StatePanel>
      ) : menus.length === 0 ? (
        <StatePanel>
          <Menu className="size-8 text-muted-foreground" />
          <p>Chưa có menu website.</p>
          {canCreate ? (
            <Button onClick={() => setCreating(true)}>Tạo menu đầu tiên</Button>
          ) : null}
        </StatePanel>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-xl shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden lg:table-cell">Vị trí</TableHead>
                <TableHead className="hidden sm:table-cell">Mục</TableHead>
                <TableHead className="hidden md:table-cell">Cập nhật</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>
                    <Link
                      className="font-medium hover:underline"
                      href={`/admin/menus/${menu.id}/edit`}
                    >
                      {menu.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {menu.key}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={
                          menu.status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {menu.status === "published"
                          ? "Đã xuất bản"
                          : "Bản nháp"}
                      </Badge>
                      {menu.isDirty && menu.status === "published" ? (
                        <Badge variant="outline">Có thay đổi</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex max-w-72 flex-wrap gap-1">
                      {menu.locations.length
                        ? menu.locations.map(({ location }) => (
                            <Badge key={location} variant="outline">
                              {locationLabels[location]}
                            </Badge>
                          ))
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {menu.itemCount ?? 0}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(menu.updatedAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={busyId === menu.id}
                        >
                          {busyId === menu.id ? (
                            <LoaderCircle className="animate-spin" />
                          ) : (
                            <MoreHorizontal />
                          )}
                          <span className="sr-only">Mở thao tác</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/menus/${menu.id}/edit`}>
                              <ExternalLink />
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {canPublish ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              void mutate(
                                menu,
                                () =>
                                  menu.status === "published" && !menu.isDirty
                                    ? unpublishMenu(menu.id)
                                    : publishMenu(menu.id),
                                menu.status === "published" && !menu.isDirty
                                  ? "Đã gỡ xuất bản."
                                  : "Đã xuất bản menu.",
                              )
                            }
                          >
                            <Send />
                            {menu.status === "published" && !menu.isDirty
                              ? "Gỡ xuất bản"
                              : "Xuất bản"}
                          </DropdownMenuItem>
                        ) : null}
                        {canCreate ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              void mutate(
                                menu,
                                () => duplicateMenu(menu.id),
                                "Đã nhân bản menu.",
                              )
                            }
                          >
                            <Copy />
                            Nhân bản
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() =>
                                void mutate(
                                  menu,
                                  () => deleteMenu(menu.id),
                                  "Đã xóa menu.",
                                )
                              }
                            >
                              <Trash2 />
                              Xóa
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateMenuDialog
        languages={languages}
        open={creating}
        onOpenChange={setCreating}
        onCreated={() => void load()}
      />
    </div>
  );
}

function StatePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function CreateMenuDialog({
  languages,
  open,
  onOpenChange,
  onCreated,
}: {
  languages: LanguageOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const publishedLanguages = languages.filter(
      (language) => language.status === "published",
    );
    const defaultLanguage =
      publishedLanguages.find((language) => language.isDefault) ??
      publishedLanguages[0];
    if (!defaultLanguage) {
      toast.error("Cần cấu hình ít nhất một ngôn ngữ đã xuất bản.");
      return;
    }
    setSaving(true);
    try {
      await createMenu({
        name,
        key,
        description,
        translations: [{ locale: defaultLanguage.locale, title: name }],
      });
      toast.success("Đã tạo menu.");
      setName("");
      setKey("");
      setDescription("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo menu.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Tạo menu website</DialogTitle>
            <DialogDescription>
              Key dùng để định danh nội bộ và không thể thay đổi sau khi tạo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="menu-name">Tên quản trị</Label>
              <Input
                id="menu-name"
                maxLength={100}
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!key) {
                    setKey(
                      event.target.value
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    );
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-key">Key</Label>
              <Input
                id="menu-key"
                className="font-mono"
                pattern="[a-z][a-z0-9-]{1,49}"
                required
                value={key}
                onChange={(event) => setKey(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-description">Mô tả</Label>
              <Textarea
                id="menu-description"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? <LoaderCircle className="animate-spin" /> : <Plus />}
              Tạo menu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
