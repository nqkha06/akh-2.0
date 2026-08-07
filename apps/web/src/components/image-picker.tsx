"use client";
/* eslint-disable @next/next/no-img-element */

import { ImageIcon, Images, Link2, Palette, PlayCircle, Video } from "lucide-react";
import { useState } from "react";

import { ManagedImagePicker } from "@/components/media/managed-image-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getFilePreviewUrl } from "@/lib/api-client";
import {
  GALLERY_ACCEPTED_MIME_TYPES,
} from "@/features/link-in-bio/gallery/gallery-types";
import { BackgroundPresetPicker } from "@/features/link-in-bio/backgrounds/background-preset-picker";
import { getBioBackgroundPresetById } from "@/features/link-in-bio/backgrounds/background-presets";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";

export type BackgroundMediaType = "image" | "video" | "youtube";

export type BackgroundMedia = {
  id: string;
  fileId?: string;
  type: BackgroundMediaType;
  url: string;
};

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
  const businessConfig = useBusinessConfig();
  const backgroundVideos = businessConfig.presetLibrary.videos;
  const videoCategories = ["All", ...Array.from(new Set(backgroundVideos.flatMap((video) => video.categories))).sort()];
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [videoCategory, setVideoCategory] = useState("All");
  const [youtubeUrl, setYoutubeUrl] = useState(selectedMedia?.type === "youtube" ? selectedMedia.url : "");
  const filteredVideos = backgroundVideos.filter((video) => videoCategory === "All" || video.categories.some((category) => category === videoCategory));
  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);
  const selectedPreset = selectedMedia?.type === "image"
    ? getBioBackgroundPresetById(selectedMedia.id)
    : undefined;
  const defaultTab = selectedPreset
    ? "presets"
    : selectedMedia?.type === "video"
      ? "videos"
      : selectedMedia?.type === "youtube"
        ? "embed"
        : "images";

  function useYouTubeBackground() {
    if (!youtubeEmbedUrl) return;
    onMediaSelect({ id: "youtube", type: "youtube", url: youtubeUrl.trim() });
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <Tabs defaultValue={defaultTab}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="presets"><Palette />Mẫu</TabsTrigger>
          <TabsTrigger value="images"><Images />Thư viện</TabsTrigger>
          <TabsTrigger value="videos"><Video />Video</TabsTrigger>
          <TabsTrigger value="embed"><Link2 />Nhúng YT</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-4">
          <BackgroundPresetPicker
            selectedPresetId={selectedPreset?.id}
            onSelect={(preset) => onMediaSelect({
              id: preset.id,
              type: "image",
              url: preset.imageUrl,
            })}
          />
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/15 p-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background text-muted-foreground">
              {selectedMedia?.type === "image"
                ? <img src={selectedMedia.url} alt="Ảnh nền hiện tại" className="size-full object-cover" />
                : <ImageIcon className="size-5" aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{selectedMedia?.type === "image" && !selectedPreset ? "Ảnh nền đã chọn" : "Dùng ảnh của bạn"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Chọn ảnh có sẵn hoặc upload ảnh mới trong Media Manager.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setMediaManagerOpen(true)}>
              <ImageIcon />{selectedMedia?.type === "image" && !selectedPreset ? "Thay ảnh" : "Chọn ảnh"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-4 space-y-3">
          <ScrollArea className="w-full whitespace-nowrap"><ToggleGroup type="single" value={videoCategory} onValueChange={(value) => value && setVideoCategory(value)} variant="outline" spacing={1} className="w-max">{videoCategories.map((category) => <ToggleGroupItem key={category} value={category} size="sm">{category}</ToggleGroupItem>)}</ToggleGroup></ScrollArea>
          <p className="text-xs text-muted-foreground">{filteredVideos.length} video</p>
          <div className="grid max-h-90 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">
            {filteredVideos.map((video) => {
              const selected = selectedMedia?.type === "video" && selectedMedia.id === video.id;
              return <Button key={video.id} type="button" variant="outline" aria-pressed={selected} className="relative aspect-square h-auto w-full overflow-hidden p-0" onClick={() => onMediaSelect({ id: video.id, type: "video", url: video.videoUrl })}><video src={video.videoUrl} muted loop playsInline preload="metadata" onMouseEnter={(event) => void event.currentTarget.play()} onMouseLeave={(event) => event.currentTarget.pause()} className="size-full object-cover" /><span className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" /><span className="absolute inset-x-2 bottom-2 text-left"><Badge variant="secondary"><PlayCircle />{video.source}</Badge><span className="mt-1 block truncate text-xs font-medium text-white">{video.name}</span></span>{selected ? <Badge className="absolute top-2 right-2">Đã chọn</Badge> : null}</Button>;
            })}
          </div>
        </TabsContent>

        <TabsContent value="embed" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Dán URL YouTube để dùng video làm background.</p>
          <div className="flex flex-col gap-2 sm:flex-row"><Input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." type="url" /><Button type="button" onClick={useYouTubeBackground} disabled={!youtubeEmbedUrl}>Dùng video</Button></div>
          {youtubeUrl && !youtubeEmbedUrl ? <p className="text-sm text-destructive">URL YouTube không hợp lệ.</p> : null}
          {youtubeEmbedUrl ? <div className="relative aspect-video overflow-hidden rounded-md border bg-black"><iframe src={youtubeEmbedUrl} title="Xem trước YouTube background" allow="autoplay; encrypted-media; picture-in-picture" className="size-full" /></div> : null}
        </TabsContent>
      </Tabs>

      {selectedMedia ? <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onMediaSelect(null)}>Bỏ background media</Button> : null}
      <ManagedImagePicker
        open={mediaManagerOpen}
        onOpenChange={setMediaManagerOpen}
        selectedFileId={selectedMedia?.type === "image" ? selectedMedia.fileId : undefined}
        acceptedMimeTypes={GALLERY_ACCEPTED_MIME_TYPES}
        maxSize={businessConfig.uploads.coverImageMaxBytes}
        title="Chọn ảnh nền từ Media Manager"
        onSelect={(file) => onMediaSelect({
          id: `file:${file.id}`,
          fileId: file.id,
          type: "image",
          url: getFilePreviewUrl(file),
        })}
      />
    </div>
  );
}
