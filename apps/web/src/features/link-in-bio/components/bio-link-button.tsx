"use client";

import type React from "react";
import { ArrowUpRight, Link2 } from "lucide-react";

import {
  getLinkAnimationClassName,
  getLinkAnimationPreviewClassName,
  getLinkAnimationStyle,
} from "../content-blocks/link-animation";
import {
  getBioLinkClass,
  getBioLinkIconClass,
  getBioLinkIconStyle,
  getBioLinkStyle,
} from "./bio-appearance";
import type { BioBackgroundPresetTheme } from "../backgrounds/background-presets";
import type { BioCustomLinkDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function getLinkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Liên kết";
  }
}

export function BioLinkButton({
  link,
  buttonStyle,
  theme,
  contentIndex,
  preview = false,
  onClick,
}: {
  link: BioCustomLinkDto;
  buttonStyle: string;
  theme: BioBackgroundPresetTheme;
  contentIndex: number;
  preview?: boolean;
  onClick?: () => void;
}) {
  const animationClassName = preview
    ? getLinkAnimationPreviewClassName(link.animationEffect)
    : getLinkAnimationClassName(link.animationEffect);
  const animationStyle = preview
    ? getLinkAnimationStyle(0)
    : getLinkAnimationStyle(contentIndex, 180);
  const className = cn(getBioLinkClass(buttonStyle), animationClassName);
  const style = {
    ...getBioLinkStyle(buttonStyle, theme),
    ...animationStyle,
    "--bio-accent": theme.accentColor,
    "--bio-button-border": theme.buttonBorderColor,
  } as React.CSSProperties;
  const content = (
    <>
      <span className={cn("grid size-11 shrink-0 place-items-center shadow-sm", getBioLinkIconClass(buttonStyle))} style={getBioLinkIconStyle(theme)} aria-hidden>
        <Link2 className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-5 tracking-[-0.01em]">{link.title || "Liên kết chưa đặt tên"}</span>
        <span className="mt-0.5 block truncate text-[11px] font-medium leading-4 opacity-65">{getLinkHost(link.url)}</span>
      </span>
      <span className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border opacity-85 shadow-sm transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100",
      )} style={{ backgroundColor: theme.iconColor, borderColor: theme.buttonBorderColor, color: theme.iconTextColor }} aria-hidden>
        <ArrowUpRight className="size-4" />
      </span>
    </>
  );

  if (preview) {
    return (
      <button type="button" className={className} style={style} aria-label={`Xem trước ${link.title || "liên kết"}`}>
        {content}
      </button>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={className}
      style={style}
      aria-label={`${link.title || "Mở liên kết"} — ${getLinkHost(link.url)}`}
    >
      {content}
    </a>
  );
}
