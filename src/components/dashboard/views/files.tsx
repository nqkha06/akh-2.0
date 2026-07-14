"use client";

import {
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  deleteFile,
  getFileDownloadUrl,
  getFiles,
  type ManagedFileDto,
  updateFile,
  uploadFile,
} from "@/lib/api-client";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "../ui";

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
  if (size === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unit;

  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function renderFileIcon(file: ManagedFileDto, size = 20) {
  if (file.mimeType.startsWith("image/")) return <FileImage size={size} />;
  if (file.mimeType.startsWith("video/")) return <FileVideo size={size} />;
  if (file.mimeType.startsWith("audio/")) return <FileAudio size={size} />;
  if (file.mimeType.includes("zip") || file.mimeType.includes("rar")) return <FileArchive size={size} />;
  if (file.mimeType.includes("pdf") || file.mimeType.includes("text")) return <FileText size={size} />;
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
  const [filePendingDelete, setFilePendingDelete] = useState<ManagedFileDto | null>(null);

  const usagePercent = Math.min((totalSize / storageLimit) * 100, 100);

  const stats = useMemo(() => {
    const publicFiles = files.filter((file) => file.isPublic).length;
    const downloads = files.reduce((sum, file) => sum + file.downloadCount, 0);

    return { publicFiles, privateFiles: files.length - publicFiles, downloads };
  }, [files]);

  const loadFiles = useCallback(async (nextQuery: string, nextSort: FileSort) => {
    try {
      setLoading(true);
      const response = await getFiles({ q: nextQuery, sort: nextSort, direction: "desc" });
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
    return () => window.removeEventListener("STU:file-created", handleFileCreated);
  }, [loadFiles]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || uploading) return;

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
    setFilePendingDelete(null);
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
    <section className="space-y-6">
    <PageHeader
        title={"File management"}
        description={"Upload and manage your files for social link destinations."}
      />


      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => void handleSearch(event.target.value)} placeholder="Tìm file, alias, định dạng..." className="pl-9" />
              </div>
              <Select value={sort} onValueChange={(value) => void handleSort(value as FileSort)}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Ngày tải lên</SelectItem>
                  <SelectItem value="name">Tên file</SelectItem>
                  <SelectItem value="size">Dung lượng</SelectItem>
                  <SelectItem value="downloads">Lượt tải</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {error ? <Alert variant="destructive"><AlertTitle>Không thể hoàn tất thao tác</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((row) => <Skeleton key={row} className="h-24" />)}</div>
          ) : files.length === 0 ? (
            <Card>
              <CardHeader className="items-center text-center"><GenericFileIcon className="size-10 text-muted-foreground" /><CardTitle>Chưa có file</CardTitle><CardDescription>Upload file đầu tiên để dùng làm destination trong social link.</CardDescription></CardHeader>
              <CardFooter className="justify-center"><Button onClick={() => inputRef.current?.click()}><UploadCloud />Upload file</Button></CardFooter>
            </Card>
          ) : (
            <>


              <Card className="p-0">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Uploaded</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="text-muted-foreground">{renderFileIcon(file)}</TableCell>
                          <TableCell><p className="max-w-72 truncate font-medium">{file.name}</p><p className="text-xs text-muted-foreground">/{file.alias}</p></TableCell>
                          <TableCell>{file.sizeLabel}</TableCell>
                          <TableCell>{formatDate(file.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Thao tác với ${file.name}`}><MoreVertical /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => void handleCopy(file)}><Copy />Copy link</DropdownMenuItem>
                                <DropdownMenuItem asChild><a href={getFileDownloadUrl(file)}><Download />Download</a></DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => setFilePendingDelete(file)}><Trash2 />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive />Storage</CardTitle><CardDescription>{formatBytes(totalSize)} used</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><div className="flex justify-between text-sm"><span>Usage</span><span>{usagePercent.toFixed(2)}%</span></div><Progress value={usagePercent} /></div>
            <div className="grid grid-cols-2 gap-3"><div><p className="text-sm text-muted-foreground">Private</p><p className="font-medium">{stats.privateFiles}</p></div><div><p className="text-sm text-muted-foreground">Limit</p><p className="font-medium">1 GB</p></div></div>
            <Alert><Folder /><AlertTitle>Social destination</AlertTitle><AlertDescription>File upload ở đây sẽ xuất hiện trong form tạo social link để chọn làm destination sau khi người xem hoàn tất action.</AlertDescription></Alert>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(filePendingDelete)} onOpenChange={(open) => !open && setFilePendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa file?</AlertDialogTitle><AlertDialogDescription>File “{filePendingDelete?.name}” sẽ bị xóa khỏi danh sách. Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => filePendingDelete && void handleDelete(filePendingDelete)}>Xóa file</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
