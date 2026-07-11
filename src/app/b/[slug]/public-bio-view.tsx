"use client";

import type React from "react";

import {
  ArrowUpRight,
  Banknote,
  Headphones,
  Link2,
  Music,
  Play,
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

import { trackBioClick, type BioPageDto, type BioWidgetDto } from "@/lib/api-client";

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

function getWidgetIcon(type: string) {
  switch (type) {
    case "youtube-video":
      return <SiYoutube className="size-5" />;
    case "spotify-track":
      return <SiSpotify className="size-5" />;
    case "instagram-post":
      return <SiInstagram className="size-5" />;
    case "twitch-stream":
      return <SiTwitch className="size-5" />;
    case "audio-preview":
      return <Music className="size-5" />;
    default:
      return <Play className="size-5" />;
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

function getPageStyle(bioPage: BioPageDto): React.CSSProperties {
  const accent = getAccentColor(bioPage.appearance.backgroundColor);
  const rgb = parseHexColor(accent) || { r: 37, g: 99, b: 235 };
  const accentRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  if (bioPage.appearance.backgroundImage) {
    return {
      "--bio-accent": accent,
      "--bio-accent-rgb": accentRgb,
      backgroundColor: "#0f172a",
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.58)), url('${bioPage.appearance.backgroundImage}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as React.CSSProperties;
  }

  return {
    "--bio-accent": accent,
    "--bio-accent-rgb": accentRgb,
    backgroundColor: "#f8fafc",
    backgroundImage: `radial-gradient(circle at 12% 0%, rgba(${accentRgb}, 0.16), transparent 32%), radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.13), transparent 30%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 52%, #f7fee7 100%)`,
  } as React.CSSProperties;
}

function getCoverStyle(bioPage: BioPageDto): React.CSSProperties {
  const accent = getAccentColor(bioPage.appearance.backgroundColor);
  const rgb = parseHexColor(accent) || { r: 37, g: 99, b: 235 };

  if (bioPage.appearance.backgroundImage) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.48)), url('${bioPage.appearance.backgroundImage}')`,
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
      return `${base} rounded-md border border-slate-300 bg-white px-3 py-3 text-slate-950 shadow-sm hover:border-slate-500 hover:bg-slate-50`;
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

function getWidgetCardClass(buttonStyle: string) {
  const base =
    "group block cursor-pointer overflow-hidden border backdrop-blur transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)]";

  switch (buttonStyle) {
    case "minimalist":
      return `${base} rounded-xl border-slate-200 bg-white shadow-none hover:border-slate-300 hover:bg-slate-50`;
    case "mineral-square":
      return `${base} rounded-lg border-2 border-slate-950 bg-white shadow-[6px_6px_0_rgba(15,23,42,1)] hover:bg-slate-50`;
    case "rounded-border":
      return `${base} rounded-[1.65rem] border-2 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)] hover:bg-slate-50`;
    case "glow":
      return `${base} rounded-[1.65rem] border-slate-700 bg-slate-950 text-white shadow-[0_18px_58px_rgba(37,99,235,0.34)] hover:bg-slate-900`;
    case "soft-shadow":
      return `${base} rounded-2xl border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)] hover:border-slate-200`;
    case "accent-gradient":
      return `${base} rounded-[1.35rem] border-transparent bg-slate-950 text-white shadow-[0_18px_52px_rgba(37,99,235,0.24)] hover:bg-slate-900`;
    case "glass-outline":
      return `${base} rounded-[1.35rem] border-white/80 bg-white/70 shadow-[0_18px_48px_rgba(15,23,42,0.10)] hover:bg-white/88`;
    case "neon-outline":
      return `${base} rounded-[1.65rem] border-2 border-cyan-300 bg-slate-950 text-white shadow-[0_0_30px_rgba(34,211,238,0.34)] hover:bg-slate-900`;
    case "compact-sharp":
      return `${base} rounded-md border-slate-300 bg-white shadow-sm hover:border-slate-500 hover:bg-slate-50`;
    case "mineral-rounded":
      return `${base} rounded-[1.65rem] border-white/80 bg-white/85 shadow-[0_18px_52px_rgba(15,23,42,0.12)] hover:bg-white`;
    default:
      return `${base} rounded-[1.65rem] border-white/80 bg-white/92 shadow-[0_18px_52px_rgba(15,23,42,0.12)] hover:border-slate-300 hover:bg-white`;
  }
}

function renderWidget(widget: BioWidgetDto, onClick: () => void, buttonStyle: string) {
  const label = widget.title || widget.type.replace(/-/g, " ");
  const isDark =
    buttonStyle === "glow" ||
    buttonStyle === "accent-gradient" ||
    buttonStyle === "neon-outline";

  return (
    <a
      key={widget.id}
      href={widget.url}
      onClick={onClick}
      target="_blank"
      rel="noreferrer"
      className={getWidgetCardClass(buttonStyle)}
      style={getLinkButtonStyle(buttonStyle)}
    >
      <div className="flex items-stretch">
        <div
          className={`grid w-24 shrink-0 place-items-center sm:w-32 ${
            isDark
              ? "bg-white text-slate-950"
              : buttonStyle === "rounded-border"
                ? "bg-[color:var(--bio-accent)] text-white"
                : "bg-slate-950 text-white"
          }`}
        >
          {getWidgetIcon(widget.type)}
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Featured
              </p>
              <p className={`mt-1 truncate text-base font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                {label}
              </p>
            </div>
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
                isDark
                  ? "bg-white/10 text-white group-hover:bg-white group-hover:text-slate-950"
                  : "bg-slate-100 text-slate-700 group-hover:bg-slate-950 group-hover:text-white"
              }`}
            >
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <p className={`mt-3 line-clamp-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {widget.description || getHost(widget.url)}
          </p>
        </div>
      </div>
    </a>
  );
}

export function PublicBioView({ bioPage }: { bioPage: BioPageDto }) {
  const visibleLinks = bioPage.customLinks.filter(
    (link) => !bioPage.hiddenLinks.includes(link.id),
  );
  const trackClick = () => {
    void trackBioClick(bioPage.slug).catch(() => undefined);
  };
  const totalLinks =
    visibleLinks.length + bioPage.socialLinks.length + bioPage.widgets.length;
  const isDarkButton =
    bioPage.appearance.buttonStyle === "glow" ||
    bioPage.appearance.buttonStyle === "accent-gradient" ||
    bioPage.appearance.buttonStyle === "neon-outline";

  return (
    <main
      className="min-h-screen overflow-x-hidden px-4 py-5 text-slate-950 sm:px-6 sm:py-8 lg:px-10 lg:py-12"
      style={getPageStyle(bioPage)}
    >
      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <aside className="overflow-hidden rounded-[2rem] border border-white/75 bg-white/88 shadow-[0_24px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:sticky lg:top-10">
          <div className="h-36 sm:h-44" style={getCoverStyle(bioPage)} />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex items-end justify-between gap-4">
              <div className="grid size-24 shrink-0 place-items-center rounded-[1.65rem] border-4 border-white bg-slate-950 text-3xl font-bold text-white shadow-[0_18px_48px_rgba(15,23,42,0.26)] sm:size-28 sm:text-4xl">
                {getInitials(bioPage.name)}
              </div>
              <div className="mb-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                {totalLinks} links
              </div>
            </div>

            <div className="mt-5">
              <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
                {bioPage.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                rekonise.bio/{bioPage.slug}
              </p>
            </div>

            {bioPage.title ? (
              <p className="mt-5 text-base leading-7 text-slate-700">{bioPage.title}</p>
            ) : null}

            {bioPage.socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {bioPage.socialLinks.slice(0, 8).map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    onClick={trackClick}
                    target="_blank"
                    rel="noreferrer"
                    className="grid size-11 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors duration-200 hover:border-slate-400 hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)]"
                    aria-label={social.platform}
                  >
                    {getSocialIcon(social.platform)}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
              <div>
                <p className="text-2xl font-bold text-slate-950">{bioPage.views}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Views
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">{bioPage.clicks}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Clicks
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-4 rounded-[2rem] border border-white/75 bg-white/72 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-5 lg:p-6">
          {bioPage.widgets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  Featured
                </h2>
              </div>
              {bioPage.widgets.map((widget) =>
                renderWidget(widget, trackClick, bioPage.appearance.buttonStyle),
              )}
            </div>
          ) : null}

          {visibleLinks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  Links
                </h2>
              </div>
              {visibleLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  onClick={trackClick}
                  target="_blank"
                  rel="noreferrer"
                  className={getLinkButtonClass(bioPage.appearance.buttonStyle)}
                  style={getLinkButtonStyle(bioPage.appearance.buttonStyle)}
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${getLinkIconClass(
                      bioPage.appearance.buttonStyle,
                    )}`}
                  >
                    <Link2 className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-base font-bold ${isDarkButton ? "text-white" : "text-slate-950"}`}>
                      {link.title}
                    </span>
                    <span className={`mt-1 block truncate text-sm font-semibold ${isDarkButton ? "text-slate-300" : "text-slate-500"}`}>
                      {getHost(link.url)}
                    </span>
                  </span>
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
                      isDarkButton
                        ? "bg-white/10 text-white group-hover:bg-white group-hover:text-slate-950"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-950 group-hover:text-white"
                    }`}
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </a>
              ))}
            </div>
          ) : null}

          {totalLinks === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
              <p className="text-sm font-bold text-slate-600">
                This bio does not have public links yet.
              </p>
            </div>
          ) : null}

          <footer className="px-1 pt-2">
            <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Powered by Rekonise Bio
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
