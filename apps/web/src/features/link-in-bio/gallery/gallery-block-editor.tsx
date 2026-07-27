"use client";
/* eslint-disable @next/next/no-img-element */

import {
  GripVertical,
  ImagePlus,
  Images,
  LoaderCircle,
  Pencil,
  Replace,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { toast } from "sonner";

import { ManagedImagePicker } from "@/components/media/managed-image-picker";
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
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FILE_CREATED_EVENT } from "@/components/dashboard/files/events";
import { generateId } from "@/lib/id";
import {
  getFilePreviewUrl,
  type BioGalleryBlockDto,
  type BioGalleryImageDto,
  type ManagedFileDto,
  uploadFile,
} from "@/lib/api-client";
import {
  GALLERY_ACCEPTED_MIME_TYPES,
  GALLERY_FILE_ACCEPT,
  GALLERY_IMAGE_MAX_SIZE,
  GALLERY_MAX_IMAGES,
  normalizeGalleryImages,
} from "./gallery-types";

type UploadItem = {
  id: string;
  name: string;
  previewUrl: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
};

function formatBytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function fileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readImageDimensions(file: File) {
  return new Promise<{ width?: number; height?: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    image.src = url;
  });
}

function toGalleryImage(file: ManagedFileDto, dimensions: { width?: number; height?: number }): BioGalleryImageDto {
  const url = getFilePreviewUrl(file);
  return {
    id: `gallery-image-${generateId({ length: 10 })}`,
    fileId: file.id,
    url,
    thumbnailUrl: url,
    alt: file.name,
    sortOrder: 0,
    ...dimensions,
  };
}

function ImageSettingsDialog({
  image,
  open,
  onOpenChange,
  onChange,
  onDelete,
}: {
  image: BioGalleryImageDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (image: BioGalleryImageDto) => void;
  onDelete: () => void;
}) {
  const replaceInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(image);
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!draft) return null;
  const invalidLink = Boolean(draft.linkUrl?.trim()) && !isHttpUrl(draft.linkUrl!.trim());

  async function replaceImage(file: File) {
    if (!GALLERY_ACCEPTED_MIME_TYPES.includes(file.type as (typeof GALLERY_ACCEPTED_MIME_TYPES)[number])) {
      setError("Định dạng ảnh không được hỗ trợ.");
      return;
    }
    if (file.size > GALLERY_IMAGE_MAX_SIZE || file.size === 0) {
      setError(`Ảnh phải nhỏ hơn hoặc bằng ${formatBytes(GALLERY_IMAGE_MAX_SIZE)}.`);
      return;
    }
    setError("");
    setReplaceProgress(0);
    try {
      const dimensionsPromise = readImageDimensions(file);
      const uploaded = await uploadFile(file, {
        purpose: "cover",
        onProgress: setReplaceProgress,
      });
      const dimensions = await dimensionsPromise;
      const url = getFilePreviewUrl(uploaded);
      setDraft((current) => current ? {
        ...current,
        fileId: uploaded.id,
        url,
        thumbnailUrl: url,
        ...dimensions,
      } : current);
      window.dispatchEvent(new CustomEvent(FILE_CREATED_EVENT, { detail: uploaded }));
      toast.success("Đã thay thế ảnh");
    } catch (replaceError) {
      setError(replaceError instanceof Error ? replaceError.message : "Không thể thay thế ảnh.");
    } finally {
      setReplaceProgress(null);
    }
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl">
        <CredenzaHeader className="border-b border-border bg-card">
          <CredenzaTitle>Chỉnh sửa ảnh</CredenzaTitle>
          <CredenzaDescription>Thêm thông tin mô tả và liên kết cho ảnh.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="space-y-5 pt-5">
          <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
                <img src={draft.thumbnailUrl || draft.url} alt="" className="size-full object-cover" />
              </div>
              <input
                ref={replaceInput}
                type="file"
                accept={GALLERY_FILE_ACCEPT}
                className="sr-only"
                disabled={replaceProgress !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void replaceImage(file);
                  event.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" className="mt-2 w-full" disabled={replaceProgress !== null} onClick={() => replaceInput.current?.click()}>
                {replaceProgress !== null ? <LoaderCircle className="animate-spin" /> : <Replace />}
                {replaceProgress !== null ? `${replaceProgress}%` : "Thay thế ảnh"}
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor={`gallery-link-${draft.id}`}>Liên kết khi nhấn</Label>
                <Input id={`gallery-link-${draft.id}`} value={draft.linkUrl || ""} onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })} placeholder="https://example.com" />
                {invalidLink ? <p role="alert" className="text-xs text-destructive">Liên kết phải bắt đầu bằng http:// hoặc https://.</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`gallery-alt-${draft.id}`}>Văn bản thay thế</Label>
                <Input id={`gallery-alt-${draft.id}`} maxLength={300} value={draft.alt || ""} onChange={(event) => setDraft({ ...draft, alt: event.target.value })} placeholder="Mô tả nội dung ảnh" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`gallery-caption-${draft.id}`}>Chú thích</Label>
                <Textarea id={`gallery-caption-${draft.id}`} maxLength={500} rows={3} value={draft.caption || ""} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} placeholder="Chú thích ngắn cho ảnh" />
              </div>
              <label className="flex min-h-10 items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm">
                <span>Mở liên kết trong tab mới</span>
                <Switch checked={draft.openInNewTab || false} onCheckedChange={(checked) => setDraft({ ...draft, openInNewTab: checked })} disabled={!draft.linkUrl?.trim()} />
              </label>
            </div>
          </div>
          {replaceProgress !== null ? <Progress value={replaceProgress} aria-label="Tiến trình thay thế ảnh" /> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </CredenzaBody>
        <CredenzaFooter className="flex-col-reverse gap-2 border-border bg-card sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={replaceProgress !== null} onClick={onDelete}>
            <Trash2 />Xóa ảnh
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="button" disabled={replaceProgress !== null || invalidLink} onClick={() => {
              onChange({
                ...draft,
                alt: draft.alt?.trim() || undefined,
                caption: draft.caption?.trim() || undefined,
                linkUrl: draft.linkUrl?.trim() || undefined,
                openInNewTab: Boolean(draft.linkUrl?.trim()) && draft.openInNewTab,
              });
              onOpenChange(false);
            }}>Lưu thông tin</Button>
          </div>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

export function GalleryBlockEditor({
  gallery,
  onChange,
  onDelete,
  disabled,
  embedded = false,
}: {
  gallery: BioGalleryBlockDto;
  onChange: (gallery: BioGalleryBlockDto) => void;
  onDelete: () => void;
  disabled?: boolean;
  embedded?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef(gallery);
  galleryRef.current = gallery;
  const uploadedFingerprints = useRef(new Set<string>());
  const uploadPreviews = useRef(new Set<string>());
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => () => {
    for (const url of uploadPreviews.current) URL.revokeObjectURL(url);
  }, []);

  const selectedImage = gallery.images.find((image) => image.id === selectedImageId) || null;
  const isUploading = uploads.some((item) => item.status === "uploading");
  const patchGallery = <K extends keyof BioGalleryBlockDto>(key: K, value: BioGalleryBlockDto[K]) => {
    onChange({ ...gallery, [key]: value });
  };

  async function uploadImages(files: File[]) {
    const remaining = GALLERY_MAX_IMAGES - gallery.images.length - uploads.filter((item) => item.status === "uploading").length;
    if (remaining <= 0) {
      toast.error(`Mỗi bộ sưu tập tối đa ${GALLERY_MAX_IMAGES} ảnh.`);
      return;
    }
    const seen = new Set<string>();
    const accepted: File[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const fingerprint = fileFingerprint(file);
      if (seen.has(fingerprint) || uploadedFingerprints.current.has(fingerprint)) {
        errors.push(`${file.name}: ảnh đã được chọn.`);
        continue;
      }
      seen.add(fingerprint);
      if (!GALLERY_ACCEPTED_MIME_TYPES.includes(file.type as (typeof GALLERY_ACCEPTED_MIME_TYPES)[number])) {
        errors.push(`${file.name}: định dạng không hỗ trợ.`);
        continue;
      }
      if (file.size === 0 || file.size > GALLERY_IMAGE_MAX_SIZE) {
        errors.push(`${file.name}: tối đa ${formatBytes(GALLERY_IMAGE_MAX_SIZE)}.`);
        continue;
      }
      accepted.push(file);
      if (accepted.length === remaining) break;
    }
    if (files.length > accepted.length + errors.length) errors.push(`Chỉ còn ${remaining} vị trí trống.`);
    if (errors.length) toast.error(errors[0]);

    const uploadedImages = await Promise.all(accepted.map(async (file) => {
      const queueId = `upload-${generateId({ length: 10 })}`;
      const previewUrl = URL.createObjectURL(file);
      uploadPreviews.current.add(previewUrl);
      setUploads((current) => [...current, { id: queueId, name: file.name, previewUrl, progress: 0, status: "uploading" }]);
      try {
        const dimensionsPromise = readImageDimensions(file);
        const uploaded = await uploadFile(file, {
          purpose: "cover",
          onProgress: (progress) => setUploads((current) => current.map((item) => item.id === queueId ? { ...item, progress } : item)),
        });
        const dimensions = await dimensionsPromise;
        const image = toGalleryImage(uploaded, dimensions);
        uploadedFingerprints.current.add(fileFingerprint(file));
        window.dispatchEvent(new CustomEvent(FILE_CREATED_EVENT, { detail: uploaded }));
        setUploads((current) => current.filter((item) => item.id !== queueId));
        URL.revokeObjectURL(previewUrl);
        uploadPreviews.current.delete(previewUrl);
        return image;
      } catch (uploadError) {
        setUploads((current) => current.map((item) => item.id === queueId ? {
          ...item,
          status: "error",
          error: uploadError instanceof Error ? uploadError.message : "Upload thất bại.",
        } : item));
        return null;
      }
    }));
    const successfulImages = uploadedImages.filter((image): image is BioGalleryImageDto => image !== null);
    if (successfulImages.length) {
      const latestGallery = galleryRef.current;
      onChange({ ...latestGallery, images: normalizeGalleryImages([...latestGallery.images, ...successfulImages]) });
      toast.success(`Đã thêm ${successfulImages.length} ảnh vào bộ sưu tập`);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) void uploadImages(Array.from(event.target.files));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingFiles(false);
    if (!disabled) void uploadImages(Array.from(event.dataTransfer.files));
  }

  function addManagedImage(file: ManagedFileDto) {
    if (gallery.images.some((image) => image.fileId === file.id)) {
      toast.error("Ảnh này đã có trong bộ sưu tập.");
      return;
    }
    if (!GALLERY_ACCEPTED_MIME_TYPES.includes(file.mimeType.toLowerCase() as (typeof GALLERY_ACCEPTED_MIME_TYPES)[number]) || file.size > GALLERY_IMAGE_MAX_SIZE) {
      toast.error(`Chỉ hỗ trợ JPG, PNG, WEBP, GIF hoặc AVIF tối đa ${formatBytes(GALLERY_IMAGE_MAX_SIZE)}.`);
      return;
    }
    if (gallery.images.length >= GALLERY_MAX_IMAGES) {
      toast.error(`Mỗi bộ sưu tập tối đa ${GALLERY_MAX_IMAGES} ảnh.`);
      return;
    }
    onChange({ ...gallery, images: normalizeGalleryImages([...gallery.images, toGalleryImage(file, {})]) });
    toast.success("Đã thêm ảnh từ Media Manager");
  }

  const columnOptions = useMemo(() => ({
    mobile: [1, 2, 3],
    tablet: [1, 2, 3, 4],
    desktop: [1, 2, 3, 4, 5, 6],
  }), []);

  return (
    <div className="space-y-4">
      <div className={embedded ? "grid gap-3" : "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"}>
        <div className="grid gap-2">
          <Label htmlFor={`gallery-title-${gallery.id}`}>Tên bộ sưu tập</Label>
          <Input id={`gallery-title-${gallery.id}`} maxLength={120} value={gallery.title || ""} onChange={(event) => patchGallery("title", event.target.value)} placeholder="Ví dụ: Dự án mới nhất" disabled={disabled} />
        </div>
        {!embedded ? <label className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium">
          <Switch size="sm" checked={gallery.enabled} onCheckedChange={(checked) => patchGallery("enabled", checked)} disabled={disabled} />
          Hiển thị block
        </label> : null}
        {!embedded ? <label className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium">
          <Switch size="sm" checked={gallery.showTitle} onCheckedChange={(checked) => patchGallery("showTitle", checked)} disabled={disabled} />
          Hiện tiêu đề
        </label> : null}
      </div>

      <Tabs defaultValue="images">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          <TabsTrigger value="shape">Kích thước</TabsTrigger>
          <TabsTrigger value="appearance">Diện mạo</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4 space-y-4">
          <input ref={inputRef} type="file" accept={GALLERY_FILE_ACCEPT} multiple className="sr-only" disabled={disabled} onChange={handleInput} />
          <div
            onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDraggingFiles(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDraggingFiles(false)}
            onDrop={handleDrop}
            className={`rounded-xl border border-dashed px-5 py-6 text-center transition-colors ${draggingFiles ? "border-primary bg-primary/5" : "border-border bg-muted/15"}`}
          >
            <UploadCloud className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Kéo nhiều ảnh vào đây hoặc chọn từ thiết bị</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP, GIF, AVIF · tối đa {formatBytes(GALLERY_IMAGE_MAX_SIZE)}/ảnh · {GALLERY_MAX_IMAGES} ảnh/bộ sưu tập</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" disabled={disabled || gallery.images.length >= GALLERY_MAX_IMAGES} onClick={() => inputRef.current?.click()}><ImagePlus />Chọn ảnh</Button>
              <Button type="button" size="sm" variant="outline" disabled={disabled || gallery.images.length >= GALLERY_MAX_IMAGES} onClick={() => setMediaPickerOpen(true)}><Images />Media Manager</Button>
            </div>
          </div>

          {uploads.length ? (
            <div className="space-y-2" aria-live="polite">
              {uploads.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <img src={item.previewUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs"><span className="truncate font-medium">{item.name}</span><span className="tabular-nums text-muted-foreground">{item.status === "error" ? "Lỗi" : `${item.progress}%`}</span></div>
                    {item.status === "error" ? <p className="mt-1 truncate text-xs text-destructive">{item.error}</p> : <Progress value={item.progress} className="mt-2 h-1.5" />}
                  </div>
                  {item.status === "error" ? <Button type="button" size="icon-sm" variant="ghost" aria-label="Bỏ lỗi upload" onClick={() => setUploads((current) => current.filter((upload) => upload.id !== item.id))}><Trash2 /></Button> : <LoaderCircle className="size-4 animate-spin text-muted-foreground" />}
                </div>
              ))}
            </div>
          ) : null}

          {gallery.images.length ? (
            <Sortable value={gallery.images} getItemValue={(image) => image.id} onValueChange={(images) => patchGallery("images", normalizeGalleryImages(images))} orientation="mixed">
              <SortableContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.images.map((image) => (
                  <SortableItem key={image.id} value={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
                    <img src={image.thumbnailUrl || image.url} alt={image.alt || ""} className="size-full object-cover" />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent p-1.5">
                      <SortableItemHandle className="grid size-8 place-items-center rounded-md text-white hover:bg-white/15" aria-label="Kéo để sắp xếp ảnh"><GripVertical className="size-4" /></SortableItemHandle>
                      <Button type="button" variant="ghost" size="icon-sm" className="text-white hover:bg-white/15 hover:text-white" aria-label="Chỉnh sửa ảnh" onClick={() => { setSelectedImageId(image.id); setSettingsOpen(true); }}><Pencil /></Button>
                    </div>
                    {image.caption ? <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1.5 text-[11px] text-white">{image.caption}</span> : null}
                  </SortableItem>
                ))}
              </SortableContent>
            </Sortable>
          ) : !uploads.length ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Chưa có ảnh. Thêm ảnh để bắt đầu bộ sưu tập.</div>
          ) : null}
        </TabsContent>

        <TabsContent value="shape" className="mt-4 space-y-4">
          <div className="grid gap-2"><Label>Chế độ hiển thị</Label><ToggleGroup type="single" variant="outline" value={gallery.displayMode} onValueChange={(value) => value && patchGallery("displayMode", value as BioGalleryBlockDto["displayMode"])}><ToggleGroupItem value="grid">Grid</ToggleGroupItem><ToggleGroupItem value="slider">Slider</ToggleGroupItem></ToggleGroup></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["mobile", "tablet", "desktop"] as const).map((breakpoint) => <div key={breakpoint} className="grid gap-2"><Label>{breakpoint === "mobile" ? "Mobile" : breakpoint === "tablet" ? "Tablet" : "Desktop"}</Label><Select value={String(gallery.columns[breakpoint])} onValueChange={(value) => patchGallery("columns", { ...gallery.columns, [breakpoint]: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{columnOptions[breakpoint].map((value) => <SelectItem key={value} value={String(value)}>{value} {gallery.displayMode === "grid" ? "cột" : "ảnh"}</SelectItem>)}</SelectContent></Select></div>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label>Tỷ lệ ảnh</Label><Select value={gallery.aspectRatio} onValueChange={(value) => patchGallery("aspectRatio", value as BioGalleryBlockDto["aspectRatio"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1:1">Vuông · 1:1</SelectItem><SelectItem value="4:5">Dọc · 4:5</SelectItem><SelectItem value="16:9">Ngang · 16:9</SelectItem><SelectItem value="original">Tỷ lệ gốc</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Khoảng cách</Label><Select value={gallery.gap} onValueChange={(value) => patchGallery("gap", value as BioGalleryBlockDto["gap"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sm">Nhỏ</SelectItem><SelectItem value="md">Vừa</SelectItem><SelectItem value="lg">Lớn</SelectItem></SelectContent></Select></div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2"><Label>Bo góc</Label><Select value={gallery.radius} onValueChange={(value) => patchGallery("radius", value as BioGalleryBlockDto["radius"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Không</SelectItem><SelectItem value="sm">Nhỏ</SelectItem><SelectItem value="md">Vừa</SelectItem><SelectItem value="lg">Lớn</SelectItem><SelectItem value="full">Rất tròn</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Viền</Label><Select value={gallery.border} onValueChange={(value) => patchGallery("border", value as BioGalleryBlockDto["border"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Không</SelectItem><SelectItem value="subtle">Tinh tế</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Bóng đổ</Label><Select value={gallery.shadow} onValueChange={(value) => patchGallery("shadow", value as BioGalleryBlockDto["shadow"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Không</SelectItem><SelectItem value="sm">Nhẹ</SelectItem><SelectItem value="md">Vừa</SelectItem></SelectContent></Select></div>
          </div>
          <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm"><span><span className="block font-medium">Hiển thị chú thích</span><span className="mt-0.5 block text-xs text-muted-foreground">Chú thích xuất hiện dưới dạng overlay trên ảnh.</span></span><Switch checked={gallery.showCaption} onCheckedChange={(checked) => patchGallery("showCaption", checked)} /></label>
        </TabsContent>
      </Tabs>

      {!embedded ? <div className="flex justify-end border-t border-border pt-3">
        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={disabled || isUploading} onClick={() => setDeleteOpen(true)}><Trash2 />Xóa bộ sưu tập</Button>
      </div> : null}

      <ManagedImagePicker open={mediaPickerOpen} onOpenChange={setMediaPickerOpen} onSelect={addManagedImage} title="Thêm ảnh vào bộ sưu tập" />
      <ImageSettingsDialog key={selectedImage?.id || "no-gallery-image"} image={selectedImage} open={settingsOpen} onOpenChange={setSettingsOpen} onChange={(nextImage) => patchGallery("images", gallery.images.map((image) => image.id === nextImage.id ? nextImage : image))} onDelete={() => {
        if (!selectedImage) return;
        patchGallery("images", normalizeGalleryImages(gallery.images.filter((image) => image.id !== selectedImage.id)));
        setSettingsOpen(false);
        toast.success("Đã xóa ảnh khỏi bộ sưu tập");
      }} />
      {!embedded ? <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa bộ sưu tập “{gallery.title || "Chưa đặt tên"}”?</AlertDialogTitle><AlertDialogDescription>Block và cấu hình của nó sẽ bị xóa khỏi trang. Các file gốc vẫn được giữ trong Media Manager.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onDelete}>Xóa bộ sưu tập</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> : null}
    </div>
  );
}
