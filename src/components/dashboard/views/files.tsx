"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownAZ,
  CalendarArrowDown,
  Copy,
  Download,
  FileArchive,
  FileAudio,
  FileIcon as GenericFileIcon,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  HardDrive,
  Loader2,
  MoreVertical,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  deleteFile,
  getFileDownloadUrl,
  getFiles,
  type ManagedFileDto,
  updateFile,
  uploadFile,
} from "@/lib/api-client";

type FileSort = "date" | "name" | "size" | "downloads";

const storageLimit = 1024 * 1024 * 1024;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatBytes(size: number) {
  if (size === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unit;

  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function renderFileIcon(file: ManagedFileDto, size = 20) {
  if (file.mimeType.startsWith("image/")) return <FileImage size={size} />;
  if (file.mimeType.startsWith("video/")) return <FileVideo size={size} />;
  if (file.mimeType.startsWith("audio/")) return <FileAudio size={size} />;
  if (file.mimeType.includes("zip") || file.mimeType.includes("rar")) {
    return <FileArchive size={size} />;
  }
  if (file.mimeType.includes("pdf") || file.mimeType.includes("text")) {
    return <FileText size={size} />;
  }
  return <GenericFileIcon size={size} />;
}

export function FilesView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ManagedFileDto[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<FileSort>("date");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const usagePercent = Math.min((totalSize / storageLimit) * 100, 100);

  const stats = useMemo(() => {
    const publicFiles = files.filter((file) => file.isPublic).length;
    const downloads = files.reduce((sum, file) => sum + file.downloadCount, 0);

    return {
      publicFiles,
      privateFiles: files.length - publicFiles,
      downloads,
    };
  }, [files]);

  const loadFiles = useCallback(async (nextQuery: string, nextSort: FileSort) => {
    try {
      setLoading(true);
      const response = await getFiles({
        q: nextQuery,
        sort: nextSort,
        direction: "desc",
      });
      setFiles(response.items);
      setTotalSize(response.totalSize);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không tải được danh sách file.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadFiles("", "date"));
    const handleFileCreated = () => void loadFiles("", "date");

    window.addEventListener("STU:file-created", handleFileCreated);

    return () => {
      window.removeEventListener("STU:file-created", handleFileCreated);
    };
  }, [loadFiles]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || uploading) {
      return;
    }

    try {
      setUploading(true);
      const uploaded = await uploadFile(file);
      setFiles((current) => [uploaded, ...current]);
      setTotalSize((current) => current + uploaded.size);
      setError("");
      window.dispatchEvent(new CustomEvent("STU:file-created", { detail: uploaded }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload file thất bại.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleToggleVisibility(file: ManagedFileDto) {
    try {
      const updated = await updateFile(file.id, { isPublic: !file.isPublic });
      setFiles((current) => current.map((item) => (item.id === file.id ? updated : item)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Không cập nhật được file.");
    }
  }

  async function handleCopy(file: ManagedFileDto) {
    await navigator.clipboard.writeText(getFileDownloadUrl(file));
  }

  async function handleDelete(file: ManagedFileDto) {
    const confirmed = window.confirm(`Xóa file "${file.name}" khỏi danh sách?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteFile(file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setTotalSize((current) => Math.max(0, current - file.size));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xoá được file.");
    }
  }

  async function handleSearch(nextQuery: string) {
    setQuery(nextQuery);
      await loadFiles(nextQuery, sort);
  }

  async function handleSort(nextSort: FileSort) {
    setSort(nextSort);
      await loadFiles(query, nextSort);
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Folder size={23} strokeWidth={2.2} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Files
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Quản lý tài nguyên upload và chọn file làm destination cho social link.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {uploading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
            {uploading ? "Uploading..." : "Upload file"}
          </button>
          <input ref={inputRef} type="file" className="sr-only" onChange={handleUpload} />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Files" value={files.length.toString()} />
        <Metric label="Public" value={stats.publicFiles.toString()} />
        <Metric label="Downloads" value={stats.downloads.toLocaleString("vi-VN")} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 focus-within:border-blue-300 focus-within:bg-white">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => void handleSearch(event.target.value)}
                placeholder="Tìm file, alias, định dạng..."
                className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <SortButton active={sort === "date"} onClick={() => void handleSort("date")}>
                <CalendarArrowDown size={16} />
                Ngày
              </SortButton>
              <SortButton active={sort === "name"} onClick={() => void handleSort("name")}>
                <ArrowDownAZ size={16} />
                Tên
              </SortButton>
              <SortButton active={sort === "size"} onClick={() => void handleSort("size")}>
                <HardDrive size={16} />
                Size
              </SortButton>
              <SortButton active={sort === "downloads"} onClick={() => void handleSort("downloads")}>
                <Download size={16} />
                Tải
              </SortButton>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <GenericFileIcon className="mx-auto size-10 text-slate-300" />
              <h2 className="mt-3 text-lg font-bold text-slate-950">Chưa có file</h2>
              <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6 text-slate-500">
                Upload file đầu tiên để dùng làm destination trong social link.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {files.map((file) => (
                  <FileMobileCard
                    key={file.id}
                    file={file}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-sm font-bold text-slate-600">
                        <th className="w-20 px-6 py-4">Type</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Size</th>
                        <th className="px-6 py-4">Uploaded</th>
                        <th className="px-6 py-4">Access</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {files.map((file) => {
                        return (
                          <tr key={file.id} className="transition hover:bg-slate-50">
                            <td className="px-6 py-5">
                              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                {renderFileIcon(file)}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="block max-w-[360px] truncate text-slate-900">
                                {file.name}
                              </span>
                              <span className="text-xs text-slate-400">/{file.alias}</span>
                            </td>
                            <td className="px-6 py-5 text-slate-500">{file.sizeLabel}</td>
                            <td className="px-6 py-5 text-slate-500">{formatDate(file.createdAt)}</td>
                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() => void handleToggleVisibility(file)}
                                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
                                  file.isPublic
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {file.isPublic ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                                {file.isPublic ? "Public" : "Private"}
                              </button>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-1">
                                <IconButton label="Copy link" onClick={() => void handleCopy(file)}>
                                  <Copy size={17} />
                                </IconButton>
                                <a
                                  href={getFileDownloadUrl(file)}
                                  className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
                                >
                                  <Download size={17} />
                                </a>
                                <IconButton label="Delete" onClick={() => void handleDelete(file)}>
                                  <Trash2 size={17} />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <HardDrive size={20} />
            </span>
            <div>
              <h2 className="font-bold text-slate-950">Storage</h2>
              <p className="text-sm font-semibold text-slate-500">
                {formatBytes(totalSize)} used
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
              <span>Usage</span>
              <span>{usagePercent.toFixed(2)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${Math.max(usagePercent, totalSize > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SmallStat label="Private" value={stats.privateFiles.toString()} />
            <SmallStat label="Limit" value="1 GB" />
          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-800">Social destination</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-blue-700/80">
              File upload ở đây sẽ xuất hiện trong form tạo social link để chọn làm destination sau khi người xem hoàn tất action.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SortButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
        active
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
    >
      {children}
    </button>
  );
}

function FileMobileCard({
  file,
  onCopy,
  onDelete,
  onToggleVisibility,
}: {
  file: ManagedFileDto;
  onCopy: (file: ManagedFileDto) => void | Promise<void>;
  onDelete: (file: ManagedFileDto) => void | Promise<void>;
  onToggleVisibility: (file: ManagedFileDto) => void | Promise<void>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          {renderFileIcon(file, 21)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-slate-950">{file.name}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {file.sizeLabel} · {formatDate(file.createdAt)}
          </p>
        </div>
        <MoreVertical className="size-5 shrink-0 text-slate-300" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void onToggleVisibility(file)}
          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
            file.isPublic ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {file.isPublic ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
          {file.isPublic ? "Public" : "Private"}
        </button>
        <button
          type="button"
          onClick={() => void onCopy(file)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-600"
        >
          <Copy size={14} />
          Copy
        </button>
        <a
          href={getFileDownloadUrl(file)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-600"
        >
          <Download size={14} />
          Download
        </a>
        <button
          type="button"
          onClick={() => void onDelete(file)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-red-50 px-3 text-xs font-bold text-red-700"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </article>
  );
}
