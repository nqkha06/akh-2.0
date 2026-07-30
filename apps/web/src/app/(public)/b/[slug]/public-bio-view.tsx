"use client";
/* eslint-disable @next/next/no-img-element */

import type React from "react";

import {
  Banknote,
  Headphones,
  Users,
} from "lucide-react";
import {
  SiCashapp,
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiLinkerd,
  SiPaypal,
  SiReddit,
  SiSpotify,
  SiTiktok,
  SiTwitch,
  SiVenmo,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { BioWidgetEmbed } from "@/components/bio-widget-embed";
import { PublicCreatorLayout } from "@/components/public-creator-layout";
import { BankDetailsRenderer, DividerRenderer } from "@/features/link-in-bio/content-blocks/simple-content-renderers";
import { hasCompleteBankDetails } from "@/features/link-in-bio/content-blocks/simple-content-types";
import { BioLinkButton } from "@/features/link-in-bio/components/bio-link-button";
import { GalleryRenderer } from "@/features/link-in-bio/gallery/gallery-renderer";
import { contentOrderKey, normalizeContentOrder } from "@/features/link-in-bio/gallery/gallery-types";
import {
  getSiteHost,
  useSiteBrand,
} from "@/features/site-settings/components/site-brand-provider";
import { trackBioClick, type BioPageDto } from "@/lib/api-client";

function getSocialIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "youtube":
      return <SiYoutube className="size-5" />;
    case "instagram":
      return <SiInstagram className="size-5" />;
    case "facebook":
      return <SiFacebook className="size-5" />;
    case "tiktok":
      return <SiTiktok className="size-5" />;
    case "twitter":
      return <SiX className="size-5" />;
    case "linkedin":
      return <SiLinkerd className="size-5" />;
    case "reddit":
      return <SiReddit className="size-5" />;
    case "discord":
      return <SiDiscord className="size-5" />;
    case "twitch":
      return <SiTwitch className="size-5" />;
    case "spotify":
      return <SiSpotify className="size-5" />;
    case "apple music":
      return <Headphones className="size-5" />;
    case "paypal":
      return <SiPaypal className="size-5" />;
    case "venmo":
      return <SiVenmo className="size-5" />;
    case "cashapp":
      return <SiCashapp className="size-5" />;
    case "money":
    case "payment":
      return <Banknote className="size-5" />;
    default:
      return <Users className="size-5" />;
  }
}

function parseHexColor(value?: string | null) {
  if (!value?.startsWith("#")) {
    return null;
  }

  const hex = value.replace("#", "").trim();
  const fullHex =
    hex.length === 3
      ? hex
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
      : hex;

  if (!/^[0-9a-f]{6}$/i.test(fullHex)) {
    return null;
  }

  return {
    r: Number.parseInt(fullHex.slice(0, 2), 16),
    g: Number.parseInt(fullHex.slice(2, 4), 16),
    b: Number.parseInt(fullHex.slice(4, 6), 16),
  };
}

function isTooLight(rgb: { r: number; g: number; b: number }) {
  return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 235;
}

function getAccentColor(backgroundColor?: string | null) {
  const parsed = parseHexColor(backgroundColor);

  if (!parsed || isTooLight(parsed)) {
    return "#2563eb";
  }

  return backgroundColor || "#2563eb";
}

function getYouTubeEmbedUrl(value?: string | null) {
  if (!value) return "";

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

function getBackgroundMedia(bioPage: BioPageDto) {
  const { backgroundMediaType, backgroundMediaUrl, backgroundImage } = bioPage.appearance;

  if (backgroundMediaType && backgroundMediaUrl) {
    return { type: backgroundMediaType, url: backgroundMediaUrl };
  }

  return backgroundImage ? { type: "image" as const, url: backgroundImage } : null;
}

function getCoverStyle(bioPage: BioPageDto): React.CSSProperties {
  const accent = getAccentColor(bioPage.appearance.backgroundColor);
  const rgb = parseHexColor(accent) || { r: 37, g: 99, b: 235 };

  const backgroundMedia = getBackgroundMedia(bioPage);

  if (backgroundMedia?.type === "image") {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.48)), url('${backgroundMedia.url}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.72), transparent 28%), linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95), rgba(14, 165, 233, 0.72) 54%, rgba(249, 115, 22, 0.78))`,
  };
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "B";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function PublicBioView({ bioPage }: { bioPage: BioPageDto }) {
  const brand = useSiteBrand();
  const siteHost = getSiteHost(brand);
  const visibleLinks = bioPage.customLinks.filter(
    (link) => !bioPage.hiddenLinks.includes(link.id),
  );
  const visibleSocials = bioPage.socialLinks.filter((social) => social.enabled !== false);
  const visibleWidgets = bioPage.widgets.filter((widget) => widget.enabled !== false);
  const trackClick = () => {
    void trackBioClick(bioPage.slug).catch(() => undefined);
  };
  const orderedContent = normalizeContentOrder(bioPage.contentOrder, {
    socials: bioPage.socialLinks,
    widgets: bioPage.widgets,
    galleries: bioPage.galleries,
    dividers: bioPage.dividers,
    bankDetails: bioPage.bankDetails,
    links: bioPage.customLinks,
  });
  const totalContent =
    visibleLinks.length + visibleSocials.length + visibleWidgets.length +
    bioPage.galleries.filter((gallery) => gallery.enabled && gallery.images.length > 0).length +
    bioPage.dividers.filter((block) => block.enabled).length +
    bioPage.bankDetails.filter((block) => block.enabled && hasCompleteBankDetails(block)).length;
  const backgroundMedia = getBackgroundMedia(bioPage);
  const youtubeEmbedUrl = backgroundMedia?.type === "youtube"
    ? getYouTubeEmbedUrl(backgroundMedia.url)
    : "";
  const accent = getAccentColor(bioPage.appearance.backgroundColor);
  const accentRgb = parseHexColor(accent) || { r: 37, g: 99, b: 235 };
  const pageVariables = {
    "--bio-accent": accent,
    "--bio-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
  } as React.CSSProperties;

  return (
    <PublicCreatorLayout
      background={<>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-800 to-blue-950" />
        {backgroundMedia?.type === "image" ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundMedia.url})` }} /> : null}
        {backgroundMedia?.type === "video" ? <video aria-hidden="true" src={backgroundMedia.url} autoPlay muted loop playsInline className="pointer-events-none absolute inset-0 size-full object-cover" /> : null}
        {youtubeEmbedUrl ? <iframe aria-hidden="true" src={youtubeEmbedUrl} title="YouTube background" allow="autoplay; encrypted-media; picture-in-picture" className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[266%] -translate-x-1/2 -translate-y-1/2" /> : null}
      </>}
    >
      <div style={pageVariables} className="overflow-hidden rounded-2xl border border-white/50 bg-white/90 shadow-2xl backdrop-blur-xl">
        <div className="h-32 sm:h-36" style={getCoverStyle(bioPage)} />
        <div className="space-y-5 px-4 pb-5 sm:px-6 sm:pb-6">
          <header className="-mt-12 text-center">
            <div className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-[1.5rem] border-4 border-white bg-slate-950 text-3xl font-bold text-white shadow-xl sm:size-28 sm:text-4xl">
              <span>{getInitials(bioPage.name)}</span>
              {bioPage.appearance.avatarUrl ? <img src={bioPage.appearance.avatarUrl} alt={`Ảnh đại diện của ${bioPage.name}`} className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{bioPage.name}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {siteHost ? `${siteHost}/b/` : "/b/"}{bioPage.slug}
            </p>
            {bioPage.title ? <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-700">{bioPage.title}</p> : null}
          </header>
          <div className="space-y-4">
          {orderedContent.map((item, contentIndex) => {
            if (item.type === "social") {
              return visibleSocials.length ? (
                <div key={contentOrderKey(item)} className="flex flex-wrap justify-center gap-2">
                  {visibleSocials.slice(0, 8).map(({ id, url, platform }) => (
                    <a key={id} href={url} onClick={trackClick} target="_blank" rel="noopener noreferrer" aria-label={platform} className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bio-accent)]">
                      {getSocialIcon(platform)}
                    </a>
                  ))}
                </div>
              ) : null;
            }
            if (item.type === "gallery") {
              const gallery = bioPage.galleries.find((entry) => entry.id === item.id);
              return gallery ? <GalleryRenderer key={contentOrderKey(item)} gallery={gallery} onExternalLink={trackClick} /> : null;
            }
            if (item.type === "divider") {
              const block = bioPage.dividers.find((entry) => entry.id === item.id);
              return block ? <DividerRenderer key={contentOrderKey(item)} block={block} /> : null;
            }
            if (item.type === "bank-details") {
              const block = bioPage.bankDetails.find((entry) => entry.id === item.id);
              return block ? <BankDetailsRenderer key={contentOrderKey(item)} block={block} /> : null;
            }
            if (item.type === "widget") {
              const widget = visibleWidgets.find((entry) => entry.id === item.id);
              return widget ? <BioWidgetEmbed key={contentOrderKey(item)} widget={widget} onExternalLink={trackClick} /> : null;
            }
            const link = visibleLinks.find((entry) => entry.id === item.id);
            if (!link) return null;
            return <BioLinkButton key={contentOrderKey(item)} link={link} buttonStyle={bioPage.appearance.buttonStyle} accentColor={accent} contentIndex={contentIndex} onClick={trackClick} />;
          })}

          {totalContent === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
              <p className="text-sm font-bold text-slate-600">
                This bio does not have public links yet.
              </p>
            </div>
          ) : null}

          </div>
          <footer className="border-t pt-4">
            <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Powered by {brand.siteName}
            </p>
          </footer>
        </div>
      </div>
    </PublicCreatorLayout>
  );
}
