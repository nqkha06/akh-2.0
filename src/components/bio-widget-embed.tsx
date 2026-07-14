"use client";

import { ExternalLink, Headphones, Info, Music2, PlayCircle } from "lucide-react";
import { SiInstagram, SiSpotify, SiTiktok, SiTwitch, SiYoutube } from "@icons-pack/react-simple-icons";

export type BioWidgetEmbedData = {
  id: string;
  type: string;
  title: string;
  url: string;
  description?: string;
};

function getYouTubeEmbedUrl(value: string) {
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
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

function getSpotifyEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname.replace(/^www\./, "") !== "open.spotify.com") return "";
    const [type, id] = url.pathname.split("/").filter(Boolean).filter((part) => part !== "embed");
    return ["track", "album", "playlist", "episode", "show"].includes(type) && id
      ? `https://open.spotify.com/embed/${type}/${id}`
      : "";
  } catch {
    return "";
  }
}

function getInstagramEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "instagram.com") return "";
    const [type, id] = url.pathname.split("/").filter(Boolean);
    return ["p", "reel", "tv"].includes(type) && id
      ? `https://www.instagram.com/${type}/${id}/embed/captioned/`
      : "";
  } catch {
    return "";
  }
}

function getTwitchChannel(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname.replace(/^www\./, "") !== "twitch.tv") return "";
    const channel = url.pathname.split("/").filter(Boolean)[0] || "";
    return /^[a-zA-Z0-9_]{1,25}$/.test(channel) ? channel : "";
  } catch {
    return "";
  }
}

function getTikTokEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (!["tiktok.com", "m.tiktok.com"].includes(host)) return "";
    const playerId = url.pathname.match(/^\/player\/v1\/(\d+)/)?.[1];
    const postId = url.pathname.match(/^\/@[^/]+\/video\/(\d+)/)?.[1];
    const id = playerId || postId || "";
    return /^\d{10,}$/.test(id)
      ? `https://www.tiktok.com/player/v1/${id}?controls=1&description=1`
      : "";
  } catch {
    return "";
  }
}

function getWidgetLabel(widget: BioWidgetEmbedData) {
  return widget.title || widget.type.replace(/-/g, " ");
}

export function BioWidgetEmbed({
  widget,
  onExternalLink,
}: {
  widget: BioWidgetEmbedData;
  onExternalLink?: () => void;
}) {
  const label = getWidgetLabel(widget);
  const hasUrl = Boolean(widget.url.trim());
  const youtubeUrl = getYouTubeEmbedUrl(widget.url);
  const spotifyUrl = getSpotifyEmbedUrl(widget.url);
  const instagramUrl = getInstagramEmbedUrl(widget.url);
  const twitchChannel = getTwitchChannel(widget.url);
  const tikTokUrl = getTikTokEmbedUrl(widget.url);

  const hostname = typeof window === "undefined" ? "" : window.location.hostname;

  if (!hasUrl) {
    return <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground"><Info className="size-4" />Thêm URL để xem widget thật.</div>;
  }

  if (widget.type === "youtube-video" && youtubeUrl) {
    return <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe src={youtubeUrl} title={label} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="size-full" /></div>;
  }

  if (widget.type === "spotify-track" && spotifyUrl) {
    return <iframe src={spotifyUrl} title={label} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="h-[152px] w-full overflow-hidden rounded-xl border-0" />;
  }

  if (widget.type === "instagram-post" && instagramUrl) {
    return <iframe src={instagramUrl} title={label} loading="lazy" className="h-[480px] w-full rounded-xl border-0 bg-white" />;
  }

  if (widget.type === "tiktok-video" && tikTokUrl) {
    return <div className="mx-auto aspect-[9/16] max-h-[640px] max-w-[360px] overflow-hidden rounded-xl bg-black"><iframe src={tikTokUrl} title={label} allow="fullscreen" allowFullScreen className="size-full" /></div>;
  }

  if (widget.type === "audio-preview") {
    return <div className="rounded-xl border bg-muted/30 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><Music2 className="size-4" />{label}</div><audio controls preload="metadata" className="w-full" src={widget.url}>Trình duyệt của bạn không hỗ trợ phát audio.</audio></div>;
  }

  if (widget.type === "twitch-stream" && twitchChannel && hostname) {
    return <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe src={`https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&parent=${encodeURIComponent(hostname)}&muted=true`} title={label} allowFullScreen className="size-full" /></div>;
  }

  const platformIcon = widget.type === "youtube-video" ? <SiYoutube className="size-5 text-red-600" /> : widget.type === "spotify-track" ? <SiSpotify className="size-5 text-emerald-600" /> : widget.type === "instagram-post" ? <SiInstagram className="size-5 text-pink-600" /> : widget.type === "tiktok-video" ? <SiTiktok className="size-5" /> : widget.type === "twitch-stream" ? <SiTwitch className="size-5 text-violet-600" /> : widget.type === "audio-preview" ? <Headphones className="size-5 text-blue-600" /> : <PlayCircle className="size-5" />;

  return <a href={widget.url} onClick={onExternalLink} target="_blank" rel="noreferrer" className="flex min-h-28 items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">{platformIcon}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{label}</span><span className="mt-1 block truncate text-sm text-muted-foreground">Không thể nhúng URL này — mở nội dung gốc.</span></span><ExternalLink className="size-4 shrink-0 text-muted-foreground" /></a>;
}
