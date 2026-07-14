"use client";
/* eslint-disable @next/next/no-img-element */

import { ImageIcon, ImagePlus, Link2, PlayCircle, RefreshCw, Video } from "lucide-react";
import { useMemo, useState } from "react";

import { getFileDownloadUrl, getFiles, type ManagedFileDto } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type BackgroundMediaType = "image" | "video" | "youtube";

export type BackgroundMedia = {
  id: string;
  type: BackgroundMediaType;
  url: string;
};

const backgroundImages = [
  { id: "1", name: "Neon Flow", url: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80", categories: ["Abstract", "Gradient"] },
  { id: "2", name: "Aurora Mist", url: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=600&q=80", categories: ["Gradient", "Nature"] },
  { id: "3", name: "Cosmic Dust", url: "https://images.unsplash.com/photo-1465101178521-c1a9136a3f11?auto=format&fit=crop&w=600&q=80", categories: ["Abstract", "Tech"] },
  { id: "4", name: "Blue Mirage", url: "https://images.unsplash.com/photo-1505483531331-5095d1f4b0f5?auto=format&fit=crop&w=600&q=80", categories: ["Abstract", "Gradient"] },
  { id: "5", name: "Glass Bloom", url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80", categories: ["Texture", "Abstract"] },
  { id: "6", name: "Chromatic Wave", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=600&q=80", categories: ["Gradient", "Abstract"] },
  { id: "7", name: "Prism Haze", url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=600&q=80", categories: ["Abstract", "Geometric"] },
  { id: "8", name: "Liquid Light", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80", categories: ["Gradient", "Tech"] },
  { id: "9", name: "Velvet Pulse", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80", categories: ["Texture", "Abstract"] },
  { id: "10", name: "Soft Glow", url: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=600&q=80", categories: ["Gradient", "Minimal"] },
  { id: "11", name: "Satin Wave", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80", categories: ["Abstract", "Texture"] },
  { id: "12", name: "Inferno Bloom", url: "https://images.unsplash.com/photo-1518632642078-03f0d1f3a6b7?auto=format&fit=crop&w=600&q=80", categories: ["Abstract", "Gradient"] },
  { id: "13", name: "Candy Cloud", url: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=600&q=80", categories: ["Gradient", "Texture"] },
  { id: "14", name: "Golden Drift", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80", categories: ["Nature", "Texture"] },
  { id: "15", name: "Midnight Bloom", url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80", categories: ["Nature", "Abstract"] },
  { id: "16", name: "Desert Halo", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80", categories: ["Nature", "Minimal"] },
  { id: "17", name: "Tropical Echo", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80", categories: ["Nature"] },
  { id: "18", name: "Creator Desk", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80", categories: ["Creator", "Workspace"] },
  { id: "19", name: "Glass Geometry", url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80", categories: ["Geometric", "Professional"] },
  { id: "20", name: "Aurora Gradient", url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80", categories: ["Gradient", "Abstract"] },
  { id: "21", name: "Minimal Studio", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80", categories: ["Workspace", "Professional"] },
  { id: "22", name: "Digital Workspace", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80", categories: ["Tech", "Workspace"] },
] as const;

const backgroundVideos = [
  { id: "coverr-ai-gradient", name: "Soft AI Gradient", source: "Coverr", url: "https://cdn.coverr.co/videos/user-ai-generation-kv9zE4fNgqFS/1080p.mp4", categories: ["Abstract", "Gradient"] },
  { id: "coverr-luminous-flow", name: "Luminous Flow", source: "Coverr", url: "https://cdn.coverr.co/videos/user-ai-generation-VlzTMEbjgVkr/1080p.mp4", categories: ["Abstract", "Gradient"] },
  { id: "coverr-mountain-focus", name: "Creator Journey", source: "Coverr", url: "https://cdn.coverr.co/videos/coverr-walking-to-the-mountain-top-8360/1080p.mp4", categories: ["Creator", "Nature"] },
  { id: "coverr-water-calm", name: "Calm Reflection", source: "Coverr", url: "https://cdn.coverr.co/videos/coverr-tree-reflection-in-the-water-8825/360p.mp4", categories: ["Nature", "Minimal"] },
  { id: "coverr-phone-focus", name: "Mobile Creator", source: "Coverr", url: "https://cdn.coverr.co/videos/coverr-close-up-of-man-using-iphone-15/360p.mp4", categories: ["Tech", "Creator"] },
  { id: "coverr-industrial-grid", name: "Grid Reflection", source: "Coverr", url: "https://cdn.coverr.co/videos/coverr-river-viewed-through-a-square-grid-6554/1080p.mp4", categories: ["Geometric", "Texture"] },
  { id: "coverr-studio-phone", name: "Studio Tech", source: "Coverr", url: "https://cdn.coverr.co/videos/coverr-close-up-of-iphone-15/360p.mp4", categories: ["Tech", "Professional"] },
] as const;

const imageCategories = ["All", ...Array.from(new Set(backgroundImages.flatMap((image) => image.categories))).sort()];
const videoCategories = ["All", ...Array.from(new Set(backgroundVideos.flatMap((video) => video.categories))).sort()];

function isVideoFile(file: ManagedFileDto) {
  return file.mimeType.startsWith("video/") || ["mp4", "webm", "mov", "m4v"].includes(file.extension?.toLowerCase() || "");
}

function isImageFile(file: ManagedFileDto) {
  return file.mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp", "svg"].includes(file.extension?.toLowerCase() || "");
}

export function getYouTubeEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0] || ""
      : ["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
        ? url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")
          ? url.pathname.split("/").filter(Boolean)[1] || ""
          : url.searchParams.get("v") || ""
        : "";

    return /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0`
      : "";
  } catch {
    return "";
  }
}

type ImagePickerProps = {
  selectedMedia?: BackgroundMedia | null;
  onMediaSelect: (media: BackgroundMedia | null) => void;
};

export default function ImagePicker({ selectedMedia, onMediaSelect }: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState("images");
  const [imageCategory, setImageCategory] = useState("All");
  const [videoCategory, setVideoCategory] = useState("All");
  const [files, setFiles] = useState<ManagedFileDto[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState(selectedMedia?.type === "youtube" ? selectedMedia.url : "");

  const filteredImages = useMemo(() => backgroundImages.filter((image) => imageCategory === "All" || image.categories.some((category) => category === imageCategory)), [imageCategory]);
  const filteredVideos = useMemo(() => backgroundVideos.filter((video) => videoCategory === "All" || video.categories.some((category) => category === videoCategory)), [videoCategory]);
  const backgroundFiles = files.filter((file) => file.isPublic && (isImageFile(file) || isVideoFile(file)));
  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);

  async function loadFiles() {
    try {
      setFilesLoading(true);
      setFilesError("");
      const response = await getFiles({ sort: "date", direction: "desc" });
      setFiles(response.items);
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : "Không tải được file media.");
    } finally {
      setFilesLoading(false);
    }
  }

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (value === "files" && files.length === 0 && !filesLoading) void loadFiles();
  }

  function useYouTubeBackground() {
    if (!youtubeEmbedUrl) return;
    onMediaSelect({ id: "youtube", type: "youtube", url: youtubeUrl.trim() });
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="images"><ImageIcon />Ảnh</TabsTrigger>
          <TabsTrigger value="videos"><Video />Video</TabsTrigger>
          <TabsTrigger value="files"><ImagePlus />File của tôi</TabsTrigger>
          <TabsTrigger value="embed"><Link2 />Nhúng YT</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4 space-y-3">
          <ScrollArea className="w-full whitespace-nowrap"><ToggleGroup type="single" value={imageCategory} onValueChange={(value) => value && setImageCategory(value)} variant="outline" spacing={1} className="w-max">{imageCategories.map((category) => <ToggleGroupItem key={category} value={category} size="sm">{category}</ToggleGroupItem>)}</ToggleGroup></ScrollArea>
          <p className="text-xs text-muted-foreground">{filteredImages.length} ảnh</p>
          <div className="grid max-h-90 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">
            {filteredImages.map((image) => {
              const selected = selectedMedia?.type === "image" && selectedMedia.id === image.id;
              return <Button key={image.id} type="button" variant="outline" aria-pressed={selected} className="relative aspect-square h-auto w-full overflow-hidden p-0" onClick={() => onMediaSelect({ id: image.id, type: "image", url: image.url })}><img src={image.url} alt={image.name} className="size-full object-cover" /><span className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" /><span className="absolute inset-x-2 bottom-2 truncate text-left text-xs font-medium text-white">{image.name}</span>{selected ? <Badge className="absolute top-2 right-2">Đã chọn</Badge> : null}</Button>;
            })}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-4 space-y-3">
          <ScrollArea className="w-full whitespace-nowrap"><ToggleGroup type="single" value={videoCategory} onValueChange={(value) => value && setVideoCategory(value)} variant="outline" spacing={1} className="w-max">{videoCategories.map((category) => <ToggleGroupItem key={category} value={category} size="sm">{category}</ToggleGroupItem>)}</ToggleGroup></ScrollArea>
          <p className="text-xs text-muted-foreground">{filteredVideos.length} video</p>
          <div className="grid max-h-90 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">
            {filteredVideos.map((video) => {
              const selected = selectedMedia?.type === "video" && selectedMedia.id === video.id;
              return <Button key={video.id} type="button" variant="outline" aria-pressed={selected} className="relative aspect-square h-auto w-full overflow-hidden p-0" onClick={() => onMediaSelect({ id: video.id, type: "video", url: video.url })}><video src={video.url} muted loop playsInline preload="metadata" onMouseEnter={(event) => void event.currentTarget.play()} onMouseLeave={(event) => event.currentTarget.pause()} className="size-full object-cover" /><span className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" /><span className="absolute inset-x-2 bottom-2 text-left"><Badge variant="secondary"><PlayCircle />{video.source}</Badge><span className="mt-1 block truncate text-xs font-medium text-white">{video.name}</span></span>{selected ? <Badge className="absolute top-2 right-2">Đã chọn</Badge> : null}</Button>;
            })}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Ảnh và video public có thể dùng làm nền Bio.</p><Button type="button" variant="outline" size="icon-sm" onClick={() => void loadFiles()} disabled={filesLoading} aria-label="Tải lại file media"><RefreshCw className={filesLoading ? "animate-spin" : ""} /></Button></div>
          {filesLoading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="aspect-square" />)}</div> : null}
          {filesError ? <p className="text-sm text-destructive">{filesError}</p> : null}
          {!filesLoading && !filesError && backgroundFiles.length === 0 ? <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Chưa có file ảnh hoặc video công khai.</p> : null}
          {!filesLoading && backgroundFiles.length > 0 ? <div className="grid max-h-90 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">{backgroundFiles.map((file) => {
            const isVideo = isVideoFile(file);
            const url = getFileDownloadUrl(file);
            const type: BackgroundMediaType = isVideo ? "video" : "image";
            const selected = selectedMedia?.id === `file:${file.id}`;
            return <Button key={file.id} type="button" variant="outline" aria-pressed={selected} className="relative aspect-square h-auto w-full overflow-hidden p-0" onClick={() => onMediaSelect({ id: `file:${file.id}`, type, url })}>{isVideo ? <video src={url} muted loop playsInline preload="metadata" onMouseEnter={(event) => void event.currentTarget.play()} onMouseLeave={(event) => event.currentTarget.pause()} className="size-full object-cover" /> : <img src={url} alt={file.name} className="size-full object-cover" />}<span className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" /><span className="absolute left-2 top-2"><Badge variant="secondary">{isVideo ? "Video" : "Ảnh"}</Badge></span><span className="absolute inset-x-2 bottom-2 truncate text-left text-xs font-medium text-white">{file.name}</span>{selected ? <Badge className="absolute top-2 right-2">Đã chọn</Badge> : null}</Button>;
          })}</div> : null}
        </TabsContent>

        <TabsContent value="embed" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Dán URL YouTube để dùng video làm background.</p>
          <div className="flex flex-col gap-2 sm:flex-row"><Input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." type="url" /><Button type="button" onClick={useYouTubeBackground} disabled={!youtubeEmbedUrl}>Dùng video</Button></div>
          {youtubeUrl && !youtubeEmbedUrl ? <p className="text-sm text-destructive">URL YouTube không hợp lệ.</p> : null}
          {youtubeEmbedUrl ? <div className="relative aspect-video overflow-hidden rounded-md border bg-black"><iframe src={youtubeEmbedUrl} title="Xem trước YouTube background" allow="autoplay; encrypted-media; picture-in-picture" className="size-full" /></div> : null}
        </TabsContent>
      </Tabs>

      {selectedMedia ? <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onMediaSelect(null)}>Bỏ background media</Button> : null}
    </div>
  );
}
