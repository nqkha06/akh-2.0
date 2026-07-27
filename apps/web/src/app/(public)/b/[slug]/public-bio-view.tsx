"use client";

import type React from "react";

import {
  ArrowUpRight,
  Banknote,
  Headphones,
  Link2,
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
import { getLinkAnimationClassName, getLinkAnimationStyle } from "@/features/link-in-bio/content-blocks/link-animation";
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

function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

function getLinkButtonClass(buttonStyle: string) {
  const base =
    "group flex min-h-20 cursor-pointer items-center justify-between gap-4 px-4 py-4 backdrop-blur transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)] sm:px-5";

  switch (buttonStyle) {
    case "minimalist":
      return `${base} rounded-xl border border-slate-200 bg-white text-slate-950 shadow-none hover:border-slate-300 hover:bg-slate-50`;
    case "mineral-square":
      return `${base} rounded-lg border-2 border-slate-950 bg-white text-slate-950 shadow-[6px_6px_0_rgba(15,23,42,1)] hover:bg-slate-50`;
    case "rounded-border":
      return `${base} rounded-full border-2 bg-white text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.09)] hover:bg-slate-50`;
    case "mineral-rounded":
      return `${base} rounded-[1.45rem] border border-white/80 bg-white/85 text-slate-950 shadow-[0_18px_52px_rgba(15,23,42,0.12)] hover:bg-white`;
    case "glow":
      return `${base} rounded-[1.55rem] border border-slate-700 bg-slate-950 text-white shadow-[0_18px_58px_rgba(37,99,235,0.34)] hover:bg-slate-900`;
    case "soft-shadow":
      return `${base} rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-[0_18px_42px_rgba(15,23,42,0.12)] hover:border-slate-200 hover:shadow-[0_22px_52px_rgba(15,23,42,0.16)]`;
    case "accent-gradient":
      return `${base} rounded-[1.35rem] border border-transparent bg-gradient-to-r from-slate-950 via-slate-900 to-blue-700 text-white shadow-[0_18px_52px_rgba(37,99,235,0.24)] hover:from-slate-900 hover:to-blue-600`;
    case "glass-outline":
      return `${base} rounded-[1.35rem] border border-white/80 bg-white/70 text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.10)] hover:bg-white/88`;
    case "neon-outline":
      return `${base} rounded-full border-2 border-cyan-300 bg-slate-950 text-white shadow-[0_0_30px_rgba(34,211,238,0.34)] hover:border-cyan-200 hover:bg-slate-900`;
    case "compact-sharp":
      return `${base} !min-h-12 rounded-md border border-slate-300 bg-white px-3 py-3 text-slate-950 shadow-sm hover:border-slate-500 hover:bg-slate-50`;
    default:
      return `${base} rounded-full border border-slate-950 bg-slate-950 text-white shadow-[0_18px_52px_rgba(15,23,42,0.18)] hover:bg-slate-800`;
  }
}

function getLinkIconClass(buttonStyle: string) {
  switch (buttonStyle) {
    case "minimalist":
      return "bg-slate-100 text-slate-700";
    case "mineral-rounded":
      return "bg-white text-slate-950 shadow-sm";
    case "mineral-square":
      return "bg-slate-950 text-white";
    case "rounded-border":
      return "bg-[color:var(--bio-accent)] text-white";
    case "glow":
      return "bg-white text-slate-950";
    case "soft-shadow":
      return "bg-slate-950 text-white";
    case "accent-gradient":
      return "bg-white text-slate-950";
    case "glass-outline":
      return "bg-white text-slate-950 shadow-sm";
    case "neon-outline":
      return "bg-[color:var(--bio-accent)] text-white";
    case "compact-sharp":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-white text-slate-950";
  }
}

function getLinkButtonStyle(buttonStyle: string): React.CSSProperties | undefined {
  if (buttonStyle === "rounded-border") {
    return {
      borderColor: "var(--bio-accent)",
    };
  }

  if (buttonStyle === "glow") {
    return {
      boxShadow:
        "0 18px 58px rgba(var(--bio-accent-rgb), 0.34), inset 0 1px 0 rgba(255,255,255,0.12)",
    };
  }

  if (buttonStyle === "accent-gradient") {
    return {
      backgroundImage: "linear-gradient(135deg, #0f172a 0%, var(--bio-accent) 100%)",
    };
  }

  if (buttonStyle === "neon-outline") {
    return {
      borderColor: "var(--bio-accent)",
      boxShadow:
        "0 0 30px rgba(var(--bio-accent-rgb), 0.36), inset 0 1px 0 rgba(255,255,255,0.1)",
    };
  }

  return undefined;
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
  const isDarkButton =
    bioPage.appearance.buttonStyle === "glow" ||
    bioPage.appearance.buttonStyle === "accent-gradient" ||
    bioPage.appearance.buttonStyle === "neon-outline";
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
            <div className="mx-auto flex size-24 items-center justify-center rounded-[1.5rem] border-4 border-white bg-slate-950 text-3xl font-bold text-white shadow-xl sm:size-28 sm:text-4xl">
              {getInitials(bioPage.name)}
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
            return (
              <a
                key={contentOrderKey(item)}
                href={link.url}
                onClick={trackClick}
                target="_blank"
                rel="noreferrer"
                className={`${getLinkButtonClass(bioPage.appearance.buttonStyle)} ${getLinkAnimationClassName(link.animationEffect)}`}
                style={{ ...getLinkButtonStyle(bioPage.appearance.buttonStyle), ...getLinkAnimationStyle(contentIndex) }}
              >
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${getLinkIconClass(bioPage.appearance.buttonStyle)}`}><Link2 className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-base font-bold ${isDarkButton ? "text-white" : "text-slate-950"}`}>{link.title}</span>
                  <span className={`mt-1 block truncate text-sm font-semibold ${isDarkButton ? "text-slate-300" : "text-slate-500"}`}>{getHost(link.url)}</span>
                </span>
                <span className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${isDarkButton ? "bg-white/10 text-white group-hover:bg-white group-hover:text-slate-950" : "bg-slate-100 text-slate-600 group-hover:bg-slate-950 group-hover:text-white"}`}><ArrowUpRight className="size-4" /></span>
              </a>
            );
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
