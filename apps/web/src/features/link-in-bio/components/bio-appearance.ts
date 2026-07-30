import type React from "react"

export type BioButtonStyle =
  | "rounded"
  | "minimalist"
  | "mineral-rounded"
  | "mineral-square"
  | "rounded-border"
  | "glow"
  | "soft-shadow"
  | "accent-gradient"
  | "glass-outline"
  | "neon-outline"
  | "compact-sharp"

export const bioButtonStyles: Array<{
  value: BioButtonStyle
  label: string
  description: string
}> = [
  { value: "rounded", label: "Bo tròn đặc", description: "Nút pill, nền đặc và tương phản cao." },
  { value: "minimalist", label: "Tối giản", description: "Viền mảnh, bề mặt phẳng và ít trang trí." },
  { value: "mineral-rounded", label: "Khoáng bo tròn", description: "Bề mặt trong nhẹ với góc bo sâu." },
  { value: "mineral-square", label: "Khoáng vuông", description: "Cạnh gọn cùng bóng đổ cứng, rõ nét." },
  { value: "rounded-border", label: "Viền bo tròn", description: "Nút pill sáng với viền màu chủ đạo." },
  { value: "glow", label: "Phát sáng", description: "Nền tối với quầng sáng theo màu chủ đạo." },
  { value: "soft-shadow", label: "Bóng mềm", description: "Bề mặt sáng nổi nhẹ bằng bóng khuếch tán." },
  { value: "accent-gradient", label: "Gradient chủ đạo", description: "Chuyển sắc từ nền tối sang màu chủ đạo." },
  { value: "glass-outline", label: "Viền kính", description: "Bề mặt bán trong suốt với hiệu ứng kính." },
  { value: "neon-outline", label: "Viền neon", description: "Nền tối, viền sáng và quầng neon rõ ràng." },
  { value: "compact-sharp", label: "Gọn sắc nét", description: "Chiều cao thấp, góc nhỏ và đường nét chặt." },
]

export function normalizeBioButtonStyle(value: string): BioButtonStyle {
  return bioButtonStyles.some((style) => style.value === value)
    ? (value as BioButtonStyle)
    : "rounded"
}

export function getBioAccentColor(value?: string) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value) || value.toLowerCase() === "#ffffff") {
    return "#2563eb"
  }

  return value
}

export function isDarkBioButtonStyle(value: string) {
  return ["rounded", "glow", "accent-gradient", "neon-outline"].includes(normalizeBioButtonStyle(value))
}

export function getBioLinkClass(value: string, compact = false) {
  const style = normalizeBioButtonStyle(value)
  const base = compact
    ? "flex w-full items-center justify-between gap-2 px-3 text-left text-xs font-semibold"
    : "group relative flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white/80"

  switch (style) {
    case "minimalist":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-xl border border-slate-200 bg-white text-slate-950 shadow-none hover:border-slate-300 hover:bg-slate-50`
    case "mineral-rounded":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-[1.25rem] border border-white/80 bg-white/82 text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.10)] backdrop-blur-md hover:bg-white/95`
    case "mineral-square":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-md border-2 border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,1)] hover:bg-slate-50`
    case "rounded-border":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-full border-2 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:bg-slate-50`
    case "glow":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-[1.25rem] border border-slate-700 bg-slate-950 text-white hover:bg-slate-900`
    case "soft-shadow":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.12)] hover:border-slate-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.15)]`
    case "accent-gradient":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-[1.25rem] border border-transparent text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]`
    case "glass-outline":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-[1.25rem] border border-white/80 bg-white/70 text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.10)] backdrop-blur-xl hover:bg-white/85`
    case "neon-outline":
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-full border-2 bg-slate-950 text-white hover:bg-slate-900`
    case "compact-sharp":
      return `${base} ${compact ? "h-8" : "min-h-14"} rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50`
    default:
      return `${base} ${compact ? "h-9" : "min-h-16"} rounded-full border border-slate-950 bg-slate-950 text-white shadow-[0_10px_26px_rgba(15,23,42,0.18)] hover:bg-slate-900`
  }
}

export function getBioLinkStyle(value: string, accent: string): React.CSSProperties | undefined {
  const style = normalizeBioButtonStyle(value)

  if (style === "rounded-border") return { borderColor: accent }
  if (style === "accent-gradient") return { backgroundImage: `linear-gradient(135deg, #0f172a 0%, ${accent} 100%)` }
  if (style === "glow") return { boxShadow: `0 14px 38px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.12)` }
  if (style === "neon-outline") {
    return {
      borderColor: accent,
      boxShadow: `0 0 24px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.10)`,
    }
  }

  return undefined
}

export function getBioLinkIconClass(value: string) {
  const style = normalizeBioButtonStyle(value)

  if (["mineral-square", "soft-shadow"].includes(style)) return "bg-slate-950 text-white"
  if (["rounded", "glow", "accent-gradient", "glass-outline"].includes(style)) return "bg-white text-slate-950"
  if (["rounded-border", "neon-outline"].includes(style)) return "text-white"
  return "bg-slate-100 text-slate-700"
}

export function getBioLinkIconStyle(value: string, accent: string): React.CSSProperties | undefined {
  return ["rounded-border", "neon-outline"].includes(normalizeBioButtonStyle(value))
    ? { backgroundColor: accent }
    : undefined
}
