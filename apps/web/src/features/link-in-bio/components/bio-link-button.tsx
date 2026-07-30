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
  isDarkBioButtonStyle,
} from "./bio-appearance";
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
  accentColor,
  contentIndex,
  preview = false,
  onClick,
}: {
  link: BioCustomLinkDto;
  buttonStyle: string;
  accentColor: string;
  contentIndex: number;
  preview?: boolean;
  onClick?: () => void;
}) {
  const dark = isDarkBioButtonStyle(buttonStyle);
  const animationClassName = preview
    ? getLinkAnimationPreviewClassName(link.animationEffect)
    : getLinkAnimationClassName(link.animationEffect);
  const animationStyle = preview
    ? getLinkAnimationStyle(0)
    : getLinkAnimationStyle(contentIndex, 180);
  const className = cn(getBioLinkClass(buttonStyle), animationClassName);
  const style = {
    ...getBioLinkStyle(buttonStyle, accentColor),
    ...animationStyle,
    "--bio-accent": accentColor,
  } as React.CSSProperties;
  const content = (
    <>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", getBioLinkIconClass(buttonStyle))} style={getBioLinkIconStyle(buttonStyle, accentColor)} aria-hidden>
        <Link2 className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-semibold leading-5", dark ? "text-white" : "text-slate-950")}>{link.title || "Liên kết chưa đặt tên"}</span>
        <span className={cn("mt-0.5 block truncate text-xs font-medium leading-4", dark ? "text-white/60" : "text-slate-500")}>{getLinkHost(link.url)}</span>
      </span>
      <span className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border transition-[background-color,color,transform] duration-200 group-hover:translate-x-0.5",
        dark
          ? "border-white/10 bg-white/10 text-white/80 group-hover:bg-white group-hover:text-slate-950"
          : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-950 group-hover:bg-slate-950 group-hover:text-white",
      )} aria-hidden>
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
