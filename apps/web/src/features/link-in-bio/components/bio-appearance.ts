import type React from "react"

import type { BioBackgroundPresetTheme } from "../backgrounds/background-presets"

export type BioButtonStyle = "rounded" | "rounded-border" | "mineral-square"

export const bioButtonStyles: Array<{
  value: BioButtonStyle
  label: string
  description: string
}> = [
  {
    value: "rounded",
    label: "Bo mềm",
    description: "Góc bo vừa, phù hợp với hầu hết mẫu.",
  },
  {
    value: "rounded-border",
    label: "Viên thuốc",
    description: "Viền tròn hoàn toàn và đường nét nổi bật.",
  },
  {
    value: "mineral-square",
    label: "Góc vuông",
    description: "Góc nhỏ và bóng viền gọn, rõ ràng.",
  },
]

const legacyButtonStyleMap: Record<string, BioButtonStyle> = {
  minimalist: "rounded",
  "mineral-rounded": "rounded",
  glow: "rounded",
  "soft-shadow": "rounded",
  "accent-gradient": "rounded",
  "glass-outline": "rounded-border",
  "neon-outline": "rounded-border",
  "compact-sharp": "mineral-square",
}

export function normalizeBioButtonStyle(value: string): BioButtonStyle {
  if (bioButtonStyles.some((style) => style.value === value)) {
    return value as BioButtonStyle
  }

  return legacyButtonStyleMap[value] || "rounded"
}

export function getBioLinkClass(value: string, compact = false) {
  const style = normalizeBioButtonStyle(value)
  const base = compact
    ? "flex w-full items-center justify-between gap-2 px-3 text-left text-xs font-semibold"
    : "group relative flex w-full min-w-0 items-center gap-3.5 px-3.5 py-3 text-left transition-[filter,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:brightness-[1.035] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transform-none motion-reduce:transition-none"
  const height = compact ? "h-9" : "min-h-[4.25rem]"

  if (style === "rounded-border") {
    return `${base} ${height} rounded-full border-2`
  }

  if (style === "mineral-square") {
    return `${base} ${compact ? "h-8" : "min-h-16"} rounded-lg border-2`
  }

  return `${base} ${height} rounded-2xl border`
}

export function getBioLinkStyle(
  value: string,
  theme: BioBackgroundPresetTheme,
): React.CSSProperties {
  const style = normalizeBioButtonStyle(value)

  return {
    backgroundColor: theme.buttonColor,
    borderColor: theme.buttonBorderColor,
    color: theme.buttonTextColor,
    boxShadow: style === "mineral-square"
      ? `3px 3px 0 ${theme.buttonBorderColor}`
      : style === "rounded"
        ? "0 12px 28px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.16)"
        : "0 8px 22px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
  }
}

export function getBioLinkIconClass(value: string) {
  const style = normalizeBioButtonStyle(value)

  if (style === "rounded-border") return "rounded-full"
  if (style === "mineral-square") return "rounded-md"
  return "rounded-xl"
}

export function getBioLinkIconStyle(
  theme: BioBackgroundPresetTheme,
): React.CSSProperties {
  return {
    backgroundColor: theme.iconColor,
    color: theme.iconTextColor,
  }
}
