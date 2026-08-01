import type { BioAppearanceDto } from "@/lib/api-client"
import { getBioBackgroundPresetById } from "../backgrounds/background-presets"
import { bioButtonStyles, normalizeBioButtonStyle } from "./bio-appearance"

function getThemeName(appearance: BioAppearanceDto) {
  const buttonStyle = bioButtonStyles.find(
    (style) => style.value === normalizeBioButtonStyle(appearance.buttonStyle),
  )?.label || "Bo tròn đặc"

  if (appearance.backgroundMediaType === "video") return `${buttonStyle} · Video`
  if (appearance.backgroundMediaType === "youtube") return `${buttonStyle} · YouTube`
  const preset = getBioBackgroundPresetById(appearance.selectedBackgroundId)
  if (preset) return `${buttonStyle} · ${preset.name}`
  if (appearance.backgroundImage || appearance.backgroundMediaUrl) return `${buttonStyle} · Hình ảnh`
  return buttonStyle
}

export function LinkInBioThemeIndicator({ appearance }: { appearance: BioAppearanceDto }) {
  const color = appearance.backgroundColor || "var(--primary)"
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="truncate">{getThemeName(appearance)}</span>
    </div>
  )
}

export function LinkInBioThemeAccent({ appearance }: { appearance: BioAppearanceDto }) {
  return <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: appearance.backgroundColor || "var(--primary)" }} aria-hidden="true" />
}
