"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderPlus,
  ImageIcon,
  Loader2,
  Search,
  Upload,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createAdminMediaFolder,
  getAdminMedia,
  getAdminMediaFolders,
  uploadAdminMedia,
} from "@/features/admin-media/api/admin-media.client";
import type {
  AdminMedia,
  AdminMediaFolder,
} from "@/features/admin-media/types";
import { cn } from "@/lib/utils";

export type AdminMediaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: AdminMedia) => void;
  selectedId?: string | null;
  accept?: string;
  title?: string;
  allowClear?: boolean;
  onClear?: () => void;
  canUpload?: boolean;
  canManageFolders?: boolean;
};

export function AdminMediaDialog({
  open,
  onOpenChange,
  onSelect,
  selectedId,
  accept = "image/png,image/jpeg,image/webp,image/x-icon",
  title = "Chọn ảnh từ Admin Media",
  allowClear = false,
  onClear,
  canUpload = true,
  canManageFolders = true,
}: AdminMediaDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [folders, setFolders] = React.useState<AdminMediaFolder[]>([]);
  const [media, setMedia] = React.useState<AdminMedia[]>([]);
  const [folderId, setFolderId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(
    selectedId ?? null,
  );
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [error, setError] = React.useState("");

  const loadFolders = React.useCallback(async () => {
    const response = await getAdminMediaFolders();
    setFolders(response.items);
  }, []);

  const loadMedia = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminMedia({
        page,
        limit: 18,
        folderId,
        search: search.trim() || undefined,
        type: "image",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setMedia(response.items);
      setPageCount(response.pageCount);
    } catch (loadError) {
      setError(asMessage(loadError, "Không thể tải Admin Media."));
    } finally {
      setLoading(false);
    }
  }, [folderId, page, search]);

  React.useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setPendingId(selectedId ?? null);
      void Promise.all([
        loadFolders().catch((loadError) =>
          setError(asMessage(loadError, "Không thể tải thư mục.")),
        ),
        loadMedia(),
      ]);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadFolders, loadMedia, open, selectedId]);

  const currentFolder = folders.find((folder) => folder.id === folderId);
  const visibleFolders = folders.filter(
    (folder) => folder.parentId === folderId,
  );
  const breadcrumb = buildBreadcrumb(folders, folderId);
  const pendingFile = media.find((file) => file.id === pendingId);

  async function handleUpload(files: File[]) {
    const accepted = files.filter((file) => matchesAccept(file, accept));
    if (!accepted.length) {
      setError("File không đúng định dạng được phép.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const response = await uploadAdminMedia(accepted, folderId);
      setMedia((current) => [...response.items, ...current]);
      setPendingId(response.items[0]?.id ?? null);
      await loadFolders();
    } catch (uploadError) {
      setError(asMessage(uploadError, "Không thể upload ảnh."));
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    setError("");
    try {
      await createAdminMediaFolder({
        name: newFolderName,
        parentId: folderId,
      });
      setNewFolderName("");
      await loadFolders();
    } catch (createError) {
      setError(asMessage(createError, "Không thể tạo thư mục."));
    } finally {
      setCreatingFolder(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Chỉ sử dụng file từ thư viện Admin Media độc lập.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[520px] md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden border-r bg-muted/15 p-3 md:block">
            <FolderButton
              active={folderId === null}
              label="Thư mục gốc"
              count={folders
                .filter((folder) => folder.parentId === null)
                .reduce((total, folder) => total + folder.fileCount, 0)}
              onClick={() => {
                setFolderId(null);
                setPage(1);
              }}
            />
            <div className="mt-2 space-y-1">
              {folders
                .filter((folder) => folder.parentId === null)
                .map((folder) => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    activeId={folderId}
                    onSelect={(id) => {
                      setFolderId(id);
                      setPage(1);
                    }}
                  />
                ))}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b p-3">
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo tên hoặc alt text..."
                  className="pl-8"
                />
              </div>
              <select
                value={folderId ?? "root"}
                onChange={(event) => {
                  setFolderId(
                    event.target.value === "root" ? null : event.target.value,
                  );
                  setPage(1);
                }}
                className="h-9 max-w-48 rounded-md border bg-background px-3 text-sm md:hidden"
              >
                <option value="root">Thư mục gốc</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              {canUpload ? (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files) {
                        void handleUpload(Array.from(event.target.files));
                      }
                      event.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Upload />
                    )}
                    Upload
                  </Button>
                </>
              ) : null}
            </div>

            <div className="flex min-h-11 flex-wrap items-center gap-1 border-b px-4 py-2 text-xs text-muted-foreground">
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => setFolderId(null)}
              >
                Admin Media
              </button>
              {breadcrumb.map((folder) => (
                <React.Fragment key={folder.id}>
                  <span>/</span>
                  <button
                    type="button"
                    className="font-medium text-foreground"
                    onClick={() => setFolderId(folder.id)}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {canManageFolders ? (
              <div className="flex gap-2 border-b bg-muted/10 px-4 py-2">
                <Input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleCreateFolder();
                  }}
                  placeholder={`Tạo thư mục trong ${currentFolder?.name || "thư mục gốc"}`}
                  className="h-8 max-w-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={creatingFolder || !newFolderName.trim()}
                  onClick={() => void handleCreateFolder()}
                >
                  {creatingFolder ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <FolderPlus />
                  )}
                  Tạo
                </Button>
              </div>
            ) : null}

            {error ? (
              <p className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="max-h-[54vh] flex-1 overflow-y-auto p-4">
              {visibleFolders.length ? (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {visibleFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        setFolderId(folder.id);
                        setPage(1);
                      }}
                      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted/40"
                    >
                      <Folder className="size-4 text-primary" />
                      <span className="min-w-0 flex-1 truncate">
                        {folder.name}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {folder.fileCount}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : media.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {media.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      aria-pressed={pendingId === file.id}
                      onClick={() => setPendingId(file.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border bg-card text-left outline-none transition",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        pendingId === file.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:border-primary/40",
                      )}
                    >
                      <span className="block aspect-square overflow-hidden bg-muted/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.altText || ""}
                          className="size-full object-cover transition group-hover:scale-[1.02]"
                        />
                      </span>
                      <span className="block truncate border-t px-2 py-1.5 text-xs font-medium">
                        {file.fileName}
                      </span>
                      {pendingId === file.id ? (
                        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="size-3.5" />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-52 place-items-center rounded-xl border border-dashed">
                  <div className="text-center">
                    <ImageIcon className="mx-auto size-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Chưa có ảnh</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload ảnh vào thư mục đang mở.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-xs text-muted-foreground">
                Trang {page}/{pageCount}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft />
                  <span className="sr-only">Trang trước</span>
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight />
                  <span className="sr-only">Trang sau</span>
                </Button>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="border-t px-5 py-3">
          {allowClear && onClear ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onClear();
                onOpenChange(false);
              }}
            >
              Xóa lựa chọn
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            type="button"
            disabled={!pendingFile}
            onClick={() => {
              if (!pendingFile) return;
              onSelect(pendingFile);
              onOpenChange(false);
            }}
          >
            Chọn ảnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderTreeItem({
  folder,
  folders,
  activeId,
  onSelect,
  depth = 0,
}: {
  folder: AdminMediaFolder;
  folders: AdminMediaFolder[];
  activeId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const children = folders.filter((item) => item.parentId === folder.id);
  return (
    <>
      <FolderButton
        active={activeId === folder.id}
        label={folder.name}
        count={folder.fileCount}
        onClick={() => onSelect(folder.id)}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      />
      {children.map((child) => (
        <FolderTreeItem
          key={child.id}
          folder={child}
          folders={folders}
          activeId={activeId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function FolderButton({
  active,
  label,
  count,
  onClick,
  style,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Folder className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <span className="text-xs tabular-nums">{count}</span>
    </button>
  );
}

function buildBreadcrumb(
  folders: AdminMediaFolder[],
  folderId: string | null,
) {
  const result: AdminMediaFolder[] = [];
  let cursor = folderId;
  const visited = new Set<string>();
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const folder = folders.find((item) => item.id === cursor);
    if (!folder) break;
    result.unshift(folder);
    cursor = folder.parentId;
  }
  return result;
}

function matchesAccept(file: File, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase());
  return rules.some((rule) => {
    if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    return file.type.toLowerCase() === rule;
  });
}

function asMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
