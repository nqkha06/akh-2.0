import type React from "react";

import type { LinkAnimationEffect } from "@/lib/api-client";

export const linkAnimationPresets: Array<{
  effect: LinkAnimationEffect;
  label: string;
}> = [
  { effect: "none", label: "Không có" },
  { effect: "pulse", label: "Nhịp đập" },
  { effect: "shake", label: "Lắc nhẹ" },
  { effect: "bounce", label: "Nảy" },
  { effect: "glow", label: "Phát sáng" },
];

export const linkAnimationClassNames: Record<LinkAnimationEffect, string> = {
  none: "",
  pulse: "link-bio-animation link-bio-animation--pulse",
  shake: "link-bio-animation link-bio-animation--shake",
  bounce: "link-bio-animation link-bio-animation--bounce",
  glow: "link-bio-animation link-bio-animation--glow",
};

export function normalizeLinkAnimationEffect(effect?: string): LinkAnimationEffect {
  return linkAnimationPresets.some((preset) => preset.effect === effect)
    ? effect as LinkAnimationEffect
    : "none";
}

export function getLinkAnimationClassName(effect?: string) {
  return linkAnimationClassNames[normalizeLinkAnimationEffect(effect)];
}

export function getLinkAnimationPreviewClassName(effect?: string) {
  const className = getLinkAnimationClassName(effect);
  return className ? `${className} link-bio-animation--live-preview` : "";
}

export function getLinkAnimationStyle(index: number, staggerMs = 180): React.CSSProperties {
  return {
    "--link-animation-delay": `${Math.max(0, index) * staggerMs}ms`,
  } as React.CSSProperties;
}
