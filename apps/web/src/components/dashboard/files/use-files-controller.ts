"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { bulkDeleteFiles, deleteFile, getFiles, type ManagedFileDto, updateFile, uploadFile } from "@/lib/api-client";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";

import { FILE_CREATED_EVENT } from "./events";
import type { FileSortOption, FilesFilters, FileStatusFilter, FileTypeFilter, ManagedFileView, UploadQueueItem } from "./types";

const defaultFilters: FilesFilters = { type: "all", status: "all" };
const INDETERMINATE_FILE_SIZE = 2 * 1024 * 1024;
const MINIMUM_ACTIVE_UPLOAD_MS = 450;
const PROGRESS_UPDATE_INTERVAL_MS = 100;
const SUCCESS_VISIBLE_MS = 700;
const CANCELLED_VISIBLE_MS = 700;

function validType(value: string | null): FileTypeFilter {
  return ["image", "video", "audio", "document", "archive", "other"].includes(value ?? "") ? value as FileTypeFilter : "all";
}
function validStatus(value: string | null): FileStatusFilter {
  return ["ready", "processing", "failed"].includes(value ?? "") ? value as FileStatusFilter : "all";
}
function validSort(value: string | null): FileSortOption {
  return ["newest", "oldest", "name-asc", "name-desc", "size-desc", "size-asc"].includes(value ?? "") ? value as FileSortOption : "newest";
}
function apiSort(sort: FileSortOption) {
  if (sort === "oldest") return { sort: "date" as const, direction: "asc" as const };
  if (sort === "name-asc") return { sort: "name" as const, direction: "asc" as const };
  if (sort === "name-desc") return { sort: "name" as const, direction: "desc" as const };
  if (sort === "size-asc") return { sort: "size" as const, direction: "asc" as const };
  if (sort === "size-desc") return { sort: "size" as const, direction: "desc" as const };
  return { sort: "date" as const, direction: "desc" as const };
}
function withViewData(file: ManagedFileDto): ManagedFileView { return { ...file, usageCount: file.usageCount }; }

export function useFilesController() {
  const fileSizeLimit = useBusinessConfig().uploads.memberFileMaxBytes;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<ManagedFileView[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [reservedSize, setReservedSize] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [query, setQueryState] = useState(() => searchParams.get("search") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [filters, setFilters] = useState<FilesFilters>(() => ({ type: validType(searchParams.get("type")), status: validStatus(searchParams.get("status")) }));
  const [sort, setSortState] = useState<FileSortOption>(() => validSort(searchParams.get("sort")));
  const [page, setPageState] = useState(() => Math.max(Number(searchParams.get("page")) || 1, 1));
  const [pageSize, setPageSizeState] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [previewFile, setPreviewFile] = useState<ManagedFileDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filePendingRename, setFilePendingRename] = useState<ManagedFileDto | null>(null);
  const [filePendingDelete, setFilePendingDelete] = useState<ManagedFileDto | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const uploadControllers = useRef(new Map<string, AbortController>());
  const uploadRemovalTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  const syncUrl = useCallback((next: { query: string; filters: FilesFilters; sort: FileSortOption; page: number }) => {
    const params = new URLSearchParams();
    if (next.query) params.set("search", next.query);
    if (next.filters.type !== "all") params.set("type", next.filters.type);
    if (next.filters.status !== "all") params.set("status", next.filters.status);
    if (next.sort !== "newest") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getFiles({
        q: debouncedQuery,
        ...apiSort(sort),
        ...(filters.type !== "all" ? { type: filters.type } : {}),
        ...(["ready", "processing", "failed"].includes(filters.status)
          ? { state: filters.status as "ready" | "processing" | "failed" }
          : {}),
        page,
        limit: pageSize,
      });
      setFiles(response.items.map(withViewData));
      setTotalSize(response.summary.usedBytes);
      setStorageLimit(response.summary.limitBytes);
      setReservedSize(response.summary.reservedBytes);
      setTotalItems(response.pagination.totalItems);
      setPageCount(response.pagination.totalPages);
      setSelectedIds((current) => new Set([...current].filter((id) => response.items.some((file) => file.id === id))));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters.status, filters.type, page, pageSize, sort]);

  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query), 320); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { void Promise.resolve().then(loadFiles); }, [loadFiles]);
  useEffect(() => {
    const handleFileCreated = () => void loadFiles();
    window.addEventListener(FILE_CREATED_EVENT, handleFileCreated);
    return () => window.removeEventListener(FILE_CREATED_EVENT, handleFileCreated);
  }, [loadFiles]);
  useEffect(() => {
    const controllers = uploadControllers.current;
    const removalTimers = uploadRemovalTimers.current;

    return () => {
      controllers.forEach((controller) => controller.abort());
      removalTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const setQuery = (value: string) => { setQueryState(value); setPageState(1); syncUrl({ query: value, filters, sort, page: 1 }); };
  const setType = (value: FileTypeFilter) => { const next = { ...filters, type: value }; setFilters(next); setPageState(1); syncUrl({ query, filters: next, sort, page: 1 }); };
  const setStatus = (value: FileStatusFilter) => { const next = { ...filters, status: value }; setFilters(next); setPageState(1); syncUrl({ query, filters: next, sort, page: 1 }); };
  const setSort = (value: FileSortOption) => { setSortState(value); setPageState(1); syncUrl({ query, filters, sort: value, page: 1 }); };
  const setPage = (value: number) => { setPageState(value); syncUrl({ query, filters, sort, page: value }); };
  const setPageSize = (value: number) => { setPageSizeState(value); setPageState(1); syncUrl({ query, filters, sort, page: 1 }); };
  const clearCriteria = () => { setQueryState(""); setDebouncedQuery(""); setFilters(defaultFilters); setSortState("newest"); setPageState(1); syncUrl({ query: "", filters: defaultFilters, sort: "newest", page: 1 }); };

  const visibleFiles = files;

  function scheduleUploadRemoval(id: string, delay: number) {
    const currentTimer = uploadRemovalTimers.current.get(id);
    if (currentTimer) clearTimeout(currentTimer);

    const timer = setTimeout(() => {
      setUploadQueue((current) => current.filter((entry) => entry.id !== id));
      uploadRemovalTimers.current.delete(id);
    }, delay);

    uploadRemovalTimers.current.set(id, timer);
  }

  async function runUpload(item: UploadQueueItem) {
    const controller = new AbortController();
    const startedAt = Date.now();
    let latestProgress = 0;
    let lastProgressUpdateAt = 0;
    let progressTimer: ReturnType<typeof setTimeout> | null = null;

    const flushProgress = () => {
      progressTimer = null;
      lastProgressUpdateAt = Date.now();
      const progress = latestProgress;

      setUploadQueue((current) =>
        current.map((entry) =>
          entry.id === item.id && entry.status === "uploading"
            ? { ...entry, progress }
            : entry,
        ),
      );
    };

    const updateProgress = (progress: number) => {
      if (item.indeterminate) return;

      latestProgress = Math.min(95, Math.max(latestProgress, progress));
      const elapsed = Date.now() - lastProgressUpdateAt;

      if (elapsed >= PROGRESS_UPDATE_INTERVAL_MS) {
        if (progressTimer) clearTimeout(progressTimer);
        flushProgress();
        return;
      }

      if (!progressTimer) {
        progressTimer = setTimeout(
          flushProgress,
          PROGRESS_UPDATE_INTERVAL_MS - elapsed,
        );
      }
    };

    uploadControllers.current.set(item.id, controller);
    setUploadQueue((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: "uploading",
              progress: 0,
              error: undefined,
            }
          : entry,
      ),
    );

    try {
      const uploaded = await uploadFile(item.file, {
        signal: controller.signal,
        onProgress: updateProgress,
        onFinalizing: () => {
          if (progressTimer) {
            clearTimeout(progressTimer);
            progressTimer = null;
          }

          setUploadQueue((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    status: "finalizing",
                    progress: 95,
                  }
                : entry,
            ),
          );
        },
      });

      const remainingActiveTime =
        MINIMUM_ACTIVE_UPLOAD_MS - (Date.now() - startedAt);
      if (remainingActiveTime > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, remainingActiveTime),
        );
      }

      setUploadQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "success", progress: 100 }
            : entry,
        ),
      );
      window.dispatchEvent(new CustomEvent(FILE_CREATED_EVENT, { detail: uploaded }));
      toast.success(`Đã tải lên ${uploaded.name}`);
      scheduleUploadRemoval(item.id, SUCCESS_VISIBLE_MS);
    } catch (uploadError) {
      const cancelled = uploadError instanceof DOMException && uploadError.name === "AbortError";
      setUploadQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: cancelled ? "cancelled" : "error",
                error: cancelled
                  ? undefined
                  : uploadError instanceof Error
                    ? uploadError.message
                    : "Upload thất bại.",
              }
            : entry,
        ),
      );

      if (cancelled) {
        scheduleUploadRemoval(item.id, CANCELLED_VISIBLE_MS);
      }
    } finally {
      if (progressTimer) clearTimeout(progressTimer);
      uploadControllers.current.delete(item.id);
    }
  }

  const addFiles = (nextFiles: File[]) => {
    const items = nextFiles.map((file, index): UploadQueueItem => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      status:
        file.size > fileSizeLimit || file.size === 0
          ? "error"
          : "pending",
      progress: 0,
      indeterminate: file.size < INDETERMINATE_FILE_SIZE,
      error:
        file.size > fileSizeLimit
          ? `File vượt quá giới hạn ${Math.round(fileSizeLimit / 1024 / 1024)} MB.`
          : file.size === 0
            ? "File rỗng không thể tải lên."
            : undefined,
    }));
    setUploadQueue((current) => [...current, ...items]);
    items.filter((item) => item.status === "pending").forEach((item) => void runUpload(item));
  };
  const retryUpload = (id: string) => { const item = uploadQueue.find((entry) => entry.id === id); if (item) void runUpload(item); };
  const cancelUpload = (id: string) => uploadControllers.current.get(id)?.abort();
  const removeUpload = (id: string) => {
    const removalTimer = uploadRemovalTimers.current.get(id);
    if (removalTimer) clearTimeout(removalTimer);
    uploadRemovalTimers.current.delete(id);
    setUploadQueue((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const openPreview = (file: ManagedFileDto) => { setPreviewFile(file); setPreviewOpen(true); };
  const openRename = (file: ManagedFileDto) => setFilePendingRename(file);

  async function renameFile(file: ManagedFileDto, name: string) {
    try { setBusy(true); const updated = await updateFile(file.id, { name }); setFiles((current) => current.map((item) => item.id === file.id ? withViewData(updated) : item)); setPreviewFile((current) => current?.id === file.id ? updated : current); toast.success("Đã đổi tên file."); return true; }
    catch (updateError) { toast.error(updateError instanceof Error ? updateError.message : "Không đổi được tên file."); return false; }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    if (!filePendingDelete) return;
    const target = filePendingDelete;
    setFilePendingDelete(null);
    try { await deleteFile(target.id); setPreviewOpen(false); await loadFiles(); toast.success("Đã chuyển file vào thùng rác."); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : "Không xóa được file."); }
  }

  const selectFile = (id: string, selected: boolean) => setSelectedIds((current) => { const next = new Set(current); if (selected) next.add(id); else next.delete(id); return next; });
  const selectPage = (selected: boolean) => setSelectedIds((current) => { const next = new Set(current); visibleFiles.forEach((file) => selected ? next.add(file.id) : next.delete(file.id)); return next; });
  const clearSelection = () => setSelectedIds(new Set());
  const selectedFiles = files.filter((file) => selectedIds.has(file.id));
  async function confirmBulkDelete() {
    setBulkDeleteOpen(false);
    try { setBusy(true); const count = selectedFiles.length; await bulkDeleteFiles(selectedFiles.map((file) => file.id)); clearSelection(); await loadFiles(); toast.success(`Đã chuyển ${count} file vào thùng rác.`); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : "Không xóa được các file đã chọn."); }
    finally { setBusy(false); }
  }

  return {
    files, visibleFiles, filteredTotal: totalItems, totalSize, storageLimit, reservedSize, fileSizeLimit, query, filters, sort, page: Math.min(page, pageCount), pageSize, pageCount, loading, error,
    selectedIds, selectedFiles, busy, uploadOpen, uploadQueue, previewFile, previewOpen, filePendingRename, filePendingDelete, bulkDeleteOpen,
    setQuery, setType, setStatus, setSort, setPage, setPageSize, clearCriteria, refresh: loadFiles,
    setUploadOpen, addFiles, retryUpload, cancelUpload, removeUpload, openPreview, setPreviewOpen, openRename, setFilePendingRename, renameFile,
    setFilePendingDelete, confirmDelete, setBulkDeleteOpen, confirmBulkDelete, selectFile, selectPage, clearSelection,
  };
}
