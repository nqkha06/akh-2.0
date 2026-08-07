"use client";
/* eslint-disable @next/next/no-img-element */

import {
  GripVertical,
  Pencil,
  Plus,
  Replace,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { generateId } from "@/lib/id";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";
import {
  getFilePreviewUrl,
  type BioGalleryBlockDto,
  type BioGalleryImageDto,
  type ManagedFileDto,
} from "@/lib/api-client";
import {
  GALLERY_ACCEPTED_MIME_TYPES,
  GALLERY_MAX_IMAGES,
  normalizeGalleryImages,
} from "./gallery-types";

function formatBytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  const [draft, setDraft] = useState(image);
  const [replacePickerOpen, setReplacePickerOpen] = useState(false);
  const [error, setError] = useState("");
  const imageMaxSize = useBusinessConfig().uploads.coverImageMaxBytes;

  if (!draft) return null;
  const invalidLink = Boolean(draft.linkUrl?.trim()) && !isHttpUrl(draft.linkUrl!.trim());

  function replaceImage(file: ManagedFileDto) {
    if (!GALLERY_ACCEPTED_MIME_TYPES.includes(file.mimeType.toLowerCase() as (typeof GALLERY_ACCEPTED_MIME_TYPES)[number])) {
      setError("Định dạng ảnh không được hỗ trợ.");
      return;
    }
    if (file.size > imageMaxSize || file.size === 0) {
      setError(`Ảnh phải nhỏ hơn hoặc bằng ${formatBytes(imageMaxSize)}.`);
      return;
    }
    setError("");
    const url = getFilePreviewUrl(file);
    setDraft((current) => current ? {
      ...current,
      fileId: file.id,
      url,
      thumbnailUrl: url,
    } : current);
    toast.success("Đã thay thế ảnh từ Media Manager");
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
              <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => setReplacePickerOpen(true)}>
                <Replace />Thay thế ảnh
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
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </CredenzaBody>
        <CredenzaFooter className="flex-col-reverse gap-2 border-border bg-card sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
            <Trash2 />Xóa ảnh
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="button" disabled={invalidLink} onClick={() => {
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
      <ManagedImagePicker
        open={replacePickerOpen}
        onOpenChange={setReplacePickerOpen}
        selectedFileId={draft.fileId}
        onSelect={replaceImage}
        acceptedMimeTypes={GALLERY_ACCEPTED_MIME_TYPES}
        maxSize={imageMaxSize}
        title="Thay ảnh từ Media Manager"
      />
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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const imageMaxSize = useBusinessConfig().uploads.coverImageMaxBytes;

  const selectedImage = gallery.images.find((image) => image.id === selectedImageId) || null;
  const patchGallery = <K extends keyof BioGalleryBlockDto>(key: K, value: BioGalleryBlockDto[K]) => {
    onChange({ ...gallery, [key]: value });
  };

  function addManagedImages(files: ManagedFileDto[]) {
    const existingFileIds = new Set(gallery.images.map((image) => image.fileId));
    const availableSlots = GALLERY_MAX_IMAGES - gallery.images.length;
    const accepted = files.filter((file) =>
      !existingFileIds.has(file.id) &&
      GALLERY_ACCEPTED_MIME_TYPES.includes(file.mimeType.toLowerCase() as (typeof GALLERY_ACCEPTED_MIME_TYPES)[number]) &&
      file.size > 0 &&
      file.size <= imageMaxSize,
    ).slice(0, availableSlots);
    if (!accepted.length) {
      toast.error("Ảnh đã có trong bộ sưu tập hoặc không hợp lệ.");
      return;
    }
    onChange({ ...gallery, images: normalizeGalleryImages([
      ...gallery.images,
      ...accepted.map((file) => toGalleryImage(file, {})),
    ]) });
    toast.success(`Đã thêm ${accepted.length} ảnh từ Media Manager`);
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
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Ảnh trong bộ sưu tập</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Kéo thả ảnh để thay đổi thứ tự.</p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
              {gallery.images.length}/{GALLERY_MAX_IMAGES}
            </span>
          </div>

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

              <button
                type="button"
                className="group flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/15 px-3 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                disabled={disabled || gallery.images.length >= GALLERY_MAX_IMAGES}
                aria-label={gallery.images.length >= GALLERY_MAX_IMAGES ? "Đã đạt số ảnh tối đa" : "Thêm ảnh vào bộ sưu tập"}
                onClick={() => setMediaPickerOpen(true)}
              >
                <span className="grid size-10 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors group-hover:border-primary/30 group-hover:text-primary">
                  <Plus className="size-5" />
                </span>
                <span className="text-xs font-medium text-foreground">
                  {gallery.images.length >= GALLERY_MAX_IMAGES ? "Đã đủ ảnh" : "Thêm ảnh"}
                </span>
                <span className="line-clamp-2 text-[10px] leading-4 text-muted-foreground">
                  Chọn hoặc tải lên từ Media Manager
                </span>
              </button>
            </SortableContent>
          </Sortable>

          <p className="text-[11px] leading-4 text-muted-foreground">
            JPG, PNG, WEBP, GIF, AVIF · tối đa {formatBytes(imageMaxSize)}/ảnh.
          </p>
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
        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={disabled} onClick={() => setDeleteOpen(true)}><Trash2 />Xóa bộ sưu tập</Button>
      </div> : null}

      <ManagedImagePicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(file) => addManagedImages([file])}
        onSelectMany={addManagedImages}
        multiple
        maxFiles={GALLERY_MAX_IMAGES - gallery.images.length}
        acceptedMimeTypes={GALLERY_ACCEPTED_MIME_TYPES}
        maxSize={imageMaxSize}
        title="Thêm ảnh vào bộ sưu tập"
      />
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
