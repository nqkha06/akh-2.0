import type { ManagedFileDto } from "@/lib/api-client";

export const COVER_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp", "svg"];

export function formatSnippetSize(content: string) {
  const bytes = new TextEncoder().encode(content).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function isImageFile(file: Pick<ManagedFileDto, "mimeType" | "extension">) {
  const mimeType = file.mimeType.toLowerCase();
  const extension = (file.extension || "").toLowerCase();
  return mimeType.startsWith("image/") || COVER_IMAGE_EXTENSIONS.includes(extension);
}

export function isVideoFile(file: Pick<ManagedFileDto, "mimeType" | "extension">) {
  const mimeType = file.mimeType.toLowerCase();
  const extension = (file.extension || "").toLowerCase();
  return mimeType.startsWith("video/") || ["mp4", "webm", "mov", "m4v"].includes(extension);
}

export function getYouTubeEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        id = url.searchParams.get("v") || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return "";
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return "";
  }
}
