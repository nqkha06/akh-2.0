"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { deleteFile, getFileDownloadUrl, getFiles, type ManagedFileDto, updateFile, uploadFile } from "@/lib/api-client";

import { FILE_SIZE_LIMIT, getFileType } from "./file-utils";
import type { FileSortOption, FilesFilters, FileStatusFilter, FileTypeFilter, ManagedFileView, UploadQueueItem } from "./types";

const PAGE_SIZE = 8;
const defaultFilters: FilesFilters = { type: "all", status: "all" };

function validType(value: string | null): FileTypeFilter {
  return ["image", "video", "audio", "document", "archive", "other"].includes(value ?? "") ? value as FileTypeFilter : "all";
}
function validStatus(value: string | null): FileStatusFilter {
  return ["ready", "processing", "failed", "private", "public"].includes(value ?? "") ? value as FileStatusFilter : "all";
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
function withViewData(file: ManagedFileDto): ManagedFileView { return { ...file, usageCount: null }; }

export function useFilesController() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<ManagedFileView[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [query, setQueryState] = useState(() => searchParams.get("search") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [filters, setFilters] = useState<FilesFilters>(() => ({ type: validType(searchParams.get("type")), status: validStatus(searchParams.get("status")) }));
  const [sort, setSortState] = useState<FileSortOption>(() => validSort(searchParams.get("sort")));
  const [page, setPageState] = useState(() => Math.max(Number(searchParams.get("page")) || 1, 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [previewFile, setPreviewFile] = useState<ManagedFileDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"preview" | "rename">("preview");
  const [filePendingDelete, setFilePendingDelete] = useState<ManagedFileDto | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const uploadControllers = useRef(new Map<string, AbortController>());

  const syncUrl = useCallback((next: { query: string; filters: FilesFilters; sort: FileSortOption; page: number }) => {
    const params = new URLSearchParams();
    if (next.query) params.set("search", next.query);
    if (next.filters.type !== "all") params.set("type", next.filters.type);
    if (next.filters.status !== "all") params.set("status", next.filters.status);
    if (next.sort !== "newest") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const loadFiles = useCallback(async (nextQuery: string, nextSort: FileSortOption) => {
    try {
      setLoading(true);
      const response = await getFiles({ q: nextQuery, ...apiSort(nextSort) });
      setFiles(response.items.map(withViewData));
      setTotalSize(response.totalSize);
      setSelectedIds((current) => new Set([...current].filter((id) => response.items.some((file) => file.id === id))));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query), 320); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { void Promise.resolve().then(() => loadFiles(debouncedQuery, sort)); }, [debouncedQuery, loadFiles, sort]);
  useEffect(() => {
    const handleFileCreated = () => void loadFiles(debouncedQuery, sort);
    window.addEventListener("STU:file-created", handleFileCreated);
    return () => window.removeEventListener("STU:file-created", handleFileCreated);
  }, [debouncedQuery, loadFiles, sort]);

  const setQuery = (value: string) => { setQueryState(value); setPageState(1); syncUrl({ query: value, filters, sort, page: 1 }); };
  const setType = (value: FileTypeFilter) => { const next = { ...filters, type: value }; setFilters(next); setPageState(1); syncUrl({ query, filters: next, sort, page: 1 }); };
  const setStatus = (value: FileStatusFilter) => { const next = { ...filters, status: value }; setFilters(next); setPageState(1); syncUrl({ query, filters: next, sort, page: 1 }); };
  const setSort = (value: FileSortOption) => { setSortState(value); setPageState(1); syncUrl({ query, filters, sort: value, page: 1 }); };
  const setPage = (value: number) => { setPageState(value); syncUrl({ query, filters, sort, page: value }); };
  const clearCriteria = () => { setQueryState(""); setDebouncedQuery(""); setFilters(defaultFilters); setSortState("newest"); setPageState(1); syncUrl({ query: "", filters: defaultFilters, sort: "newest", page: 1 }); };

  const filteredFiles = useMemo(() => files.filter((file) => {
    if (filters.type !== "all" && getFileType(file) !== filters.type) return false;
    const status = file.status.toLowerCase();
    if (filters.status === "ready" && !["completed", "ready"].includes(status)) return false;
    if (filters.status === "processing" && !["processing", "queued", "uploading"].includes(status)) return false;
    if (filters.status === "failed" && !["failed", "error"].includes(status)) return false;
    if (filters.status === "private" && file.isPublic) return false;
    if (filters.status === "public" && !file.isPublic) return false;
    return true;
  }), [files, filters]);
  const pageCount = Math.max(Math.ceil(filteredFiles.length / PAGE_SIZE), 1);
  const visibleFiles = filteredFiles.slice((Math.min(page, pageCount) - 1) * PAGE_SIZE, Math.min(page, pageCount) * PAGE_SIZE);

  async function runUpload(item: UploadQueueItem) {
    const controller = new AbortController();
    uploadControllers.current.set(item.id, controller);
    setUploadQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "uploading", error: undefined } : entry));
    try {
      const uploaded = await uploadFile(item.file, { signal: controller.signal });
      setUploadQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "success" } : entry));
      setFiles((current) => [withViewData(uploaded), ...current.filter((file) => file.id !== uploaded.id)]);
      setTotalSize((current) => current + uploaded.size);
      window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }));
      toast.success(`Đã tải lên ${uploaded.name}`);
    } catch (uploadError) {
      const cancelled = uploadError instanceof DOMException && uploadError.name === "AbortError";
      setUploadQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: cancelled ? "cancelled" : "error", error: cancelled ? undefined : uploadError instanceof Error ? uploadError.message : "Upload thất bại." } : entry));
    } finally {
      uploadControllers.current.delete(item.id);
    }
  }

  const addFiles = (nextFiles: File[]) => {
    const items = nextFiles.map((file, index): UploadQueueItem => ({ id: `${Date.now()}-${index}-${file.name}`, file, status: file.size > FILE_SIZE_LIMIT || file.size === 0 ? "error" : "pending", error: file.size > FILE_SIZE_LIMIT ? "File vượt quá giới hạn 100 MB." : file.size === 0 ? "File rỗng không thể tải lên." : undefined }));
    setUploadQueue((current) => [...current, ...items]);
    items.filter((item) => item.status === "pending").forEach((item) => void runUpload(item));
  };
  const retryUpload = (id: string) => { const item = uploadQueue.find((entry) => entry.id === id); if (item) void runUpload(item); };
  const cancelUpload = (id: string) => uploadControllers.current.get(id)?.abort();
  const removeUpload = (id: string) => setUploadQueue((current) => current.filter((item) => item.id !== id));

  const openPreview = (file: ManagedFileDto, mode: "preview" | "rename" = "preview") => { setPreviewFile(file); setPreviewMode(mode); setPreviewOpen(true); };
  const copyUrl = async (file: ManagedFileDto) => { await navigator.clipboard.writeText(getFileDownloadUrl(file)); toast.success("Đã sao chép URL file."); };
  const copyAlias = async (file: ManagedFileDto) => { await navigator.clipboard.writeText(`/${file.alias}`); toast.success("Đã sao chép alias."); };
  const useDestination = async (file: ManagedFileDto) => { await navigator.clipboard.writeText(getFileDownloadUrl(file)); toast.success("Đã sao chép URL để dùng làm destination."); };

  async function renameFile(file: ManagedFileDto, name: string) {
    try { setBusy(true); const updated = await updateFile(file.id, { name }); setFiles((current) => current.map((item) => item.id === file.id ? withViewData(updated) : item)); setPreviewFile(updated); toast.success("Đã đổi tên file."); }
    catch (updateError) { toast.error(updateError instanceof Error ? updateError.message : "Không đổi được tên file."); }
    finally { setBusy(false); }
  }
  async function toggleVisibility(file: ManagedFileDto) {
    try { setBusy(true); const updated = await updateFile(file.id, { isPublic: !file.isPublic }); setFiles((current) => current.map((item) => item.id === file.id ? withViewData(updated) : item)); setPreviewFile(updated); toast.success(updated.isPublic ? "File đã được công khai." : "File đã chuyển sang riêng tư."); }
    catch (updateError) { toast.error(updateError instanceof Error ? updateError.message : "Không cập nhật được file."); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!filePendingDelete) return;
    const target = filePendingDelete;
    setFilePendingDelete(null);
    try { await deleteFile(target.id); setFiles((current) => current.filter((file) => file.id !== target.id)); setTotalSize((current) => Math.max(0, current - target.size)); setPreviewOpen(false); toast.success("Đã xóa file."); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : "Không xóa được file."); }
  }

  const selectFile = (id: string, selected: boolean) => setSelectedIds((current) => { const next = new Set(current); if (selected) next.add(id); else next.delete(id); return next; });
  const selectPage = (selected: boolean) => setSelectedIds((current) => { const next = new Set(current); visibleFiles.forEach((file) => selected ? next.add(file.id) : next.delete(file.id)); return next; });
  const clearSelection = () => setSelectedIds(new Set());
  const selectedFiles = files.filter((file) => selectedIds.has(file.id));
  const downloadSelected = () => selectedFiles.forEach((file) => { const anchor = document.createElement("a"); anchor.href = getFileDownloadUrl(file); anchor.download = file.name; anchor.click(); });
  async function updateSelectedVisibility(isPublic: boolean) {
    try { setBusy(true); const updated = await Promise.all(selectedFiles.map((file) => updateFile(file.id, { isPublic }))); const map = new Map(updated.map((file) => [file.id, file])); setFiles((current) => current.map((file) => map.has(file.id) ? withViewData(map.get(file.id)!) : file)); toast.success(`Đã cập nhật ${updated.length} file.`); clearSelection(); }
    catch (updateError) { toast.error(updateError instanceof Error ? updateError.message : "Không cập nhật được các file đã chọn."); }
    finally { setBusy(false); }
  }
  async function confirmBulkDelete() {
    setBulkDeleteOpen(false);
    try { setBusy(true); await Promise.all(selectedFiles.map((file) => deleteFile(file.id))); const deletedIds = new Set(selectedFiles.map((file) => file.id)); const deletedSize = selectedFiles.reduce((sum, file) => sum + file.size, 0); setFiles((current) => current.filter((file) => !deletedIds.has(file.id))); setTotalSize((current) => Math.max(0, current - deletedSize)); toast.success(`Đã xóa ${selectedFiles.length} file.`); clearSelection(); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : "Không xóa được các file đã chọn."); }
    finally { setBusy(false); }
  }

  return {
    files, visibleFiles, filteredTotal: filteredFiles.length, totalSize, query, filters, sort, page: Math.min(page, pageCount), pageCount, loading, error,
    selectedIds, selectedFiles, busy, uploadOpen, uploadQueue, previewFile, previewOpen, previewMode, filePendingDelete, bulkDeleteOpen,
    setQuery, setType, setStatus, setSort, setPage, clearCriteria, refresh: () => loadFiles(debouncedQuery, sort),
    setUploadOpen, addFiles, retryUpload, cancelUpload, removeUpload, openPreview, setPreviewOpen, copyUrl, copyAlias, useDestination, renameFile, toggleVisibility,
    setFilePendingDelete, confirmDelete, setBulkDeleteOpen, confirmBulkDelete, selectFile, selectPage, clearSelection, downloadSelected, updateSelectedVisibility,
  };
}
