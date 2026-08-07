export type BioBackgroundPresetCategory =
  | "abstract"
  | "retro"
  | "winter"
  | "holiday";

export type BioBackgroundPreset = {
  id: string;
  name: string;
  category: BioBackgroundPresetCategory;
  imageUrl: string;
  theme: BioBackgroundPresetTheme;
};

export type BioBackgroundPresetTheme = {
  accentColor: string;
  surfaceColor: string;
  surfaceBorderColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderColor: string;
  iconColor: string;
  iconTextColor: string;
  sectionColor: string;
  sectionBorderColor: string;
};

export const defaultBioPresetTheme: BioBackgroundPresetTheme = {
  accentColor: "#2563eb",
  surfaceColor: "rgba(255, 255, 255, 0.90)",
  surfaceBorderColor: "rgba(255, 255, 255, 0.64)",
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  buttonColor: "#0f172a",
  buttonTextColor: "#ffffff",
  buttonBorderColor: "#0f172a",
  iconColor: "#ffffff",
  iconTextColor: "#0f172a",
  sectionColor: "rgba(255, 255, 255, 0.86)",
  sectionBorderColor: "rgba(148, 163, 184, 0.38)",
};

export const DEFAULT_BIO_BACKGROUND_PRESET_ID = "preset:sunset-bubbles";

export const bioBackgroundPresetCategoryLabels: Record<
  BioBackgroundPresetCategory,
  string
> = {
  abstract: "Trừu tượng",
  retro: "Hoài cổ",
  winter: "Mùa đông",
  holiday: "Lễ hội",
};

export const bioBackgroundPresets: BioBackgroundPreset[] = [
  {
    id: "preset:sunset-bubbles",
    name: "Bong bóng hoàng hôn",
    category: "abstract",
    imageUrl: "/assets/images/bios/21-sunset-bubbles-9x16.jpg",
    theme: {
      accentColor: "#f9736a",
      surfaceColor: "rgba(255, 247, 242, 0.90)",
      surfaceBorderColor: "rgba(255, 237, 213, 0.82)",
      textColor: "#431407",
      mutedTextColor: "#9a513c",
      buttonColor: "#9a3412",
      buttonTextColor: "#fff7ed",
      buttonBorderColor: "#fdba74",
      iconColor: "#ffedd5",
      iconTextColor: "#9a3412",
      sectionColor: "rgba(255, 237, 213, 0.84)",
      sectionBorderColor: "rgba(251, 146, 60, 0.34)",
    },
  },
  {
    id: "preset:retro-desktop",
    name: "Desktop hoài cổ",
    category: "retro",
    imageUrl: "/assets/images/bios/22-retro-desktop-9x16.jpg",
    theme: {
      accentColor: "#2f8f8a",
      surfaceColor: "rgba(239, 253, 250, 0.92)",
      surfaceBorderColor: "rgba(153, 246, 228, 0.70)",
      textColor: "#134e4a",
      mutedTextColor: "#467b77",
      buttonColor: "#155e75",
      buttonTextColor: "#ecfeff",
      buttonBorderColor: "#5eead4",
      iconColor: "#ccfbf1",
      iconTextColor: "#115e59",
      sectionColor: "rgba(204, 251, 241, 0.84)",
      sectionBorderColor: "rgba(20, 184, 166, 0.30)",
    },
  },
  {
    id: "preset:orange-sparkles",
    name: "Lấp lánh cam",
    category: "abstract",
    imageUrl: "/assets/images/bios/23-orange-sparkles-9x16.jpg",
    theme: {
      accentColor: "#f97316",
      surfaceColor: "rgba(255, 251, 235, 0.91)",
      surfaceBorderColor: "rgba(254, 215, 170, 0.78)",
      textColor: "#431407",
      mutedTextColor: "#92400e",
      buttonColor: "#c2410c",
      buttonTextColor: "#fff7ed",
      buttonBorderColor: "#fdba74",
      iconColor: "#ffedd5",
      iconTextColor: "#c2410c",
      sectionColor: "rgba(254, 243, 199, 0.86)",
      sectionBorderColor: "rgba(245, 158, 11, 0.34)",
    },
  },
  {
    id: "preset:crimson-lantern-glow",
    name: "Đèn lồng đỏ",
    category: "holiday",
    imageUrl: "/assets/images/bios/24-crimson-lantern-glow-9x16.jpg",
    theme: {
      accentColor: "#ef4444",
      surfaceColor: "rgba(34, 10, 12, 0.90)",
      surfaceBorderColor: "rgba(248, 113, 113, 0.34)",
      textColor: "#fff7ed",
      mutedTextColor: "#fecaca",
      buttonColor: "#fef2f2",
      buttonTextColor: "#7f1d1d",
      buttonBorderColor: "#fca5a5",
      iconColor: "#fee2e2",
      iconTextColor: "#991b1b",
      sectionColor: "rgba(69, 10, 10, 0.78)",
      sectionBorderColor: "rgba(248, 113, 113, 0.32)",
    },
  },
  {
    id: "preset:cobalt-snowfall",
    name: "Tuyết xanh cobalt",
    category: "winter",
    imageUrl: "/assets/images/bios/25-cobalt-snowfall-9x16.jpg",
    theme: {
      accentColor: "#60a5fa",
      surfaceColor: "rgba(8, 30, 73, 0.90)",
      surfaceBorderColor: "rgba(96, 165, 250, 0.36)",
      textColor: "#eff6ff",
      mutedTextColor: "#bfdbfe",
      buttonColor: "#dbeafe",
      buttonTextColor: "#1e3a8a",
      buttonBorderColor: "#93c5fd",
      iconColor: "#bfdbfe",
      iconTextColor: "#1e40af",
      sectionColor: "rgba(30, 58, 138, 0.74)",
      sectionBorderColor: "rgba(147, 197, 253, 0.32)",
    },
  },
  {
    id: "preset:arctic-mist-snowflakes",
    name: "Sương tuyết Bắc Cực",
    category: "winter",
    imageUrl: "/assets/images/bios/26-arctic-mist-snowflakes-9x16.jpg",
    theme: {
      accentColor: "#38bdf8",
      surfaceColor: "rgba(248, 252, 255, 0.93)",
      surfaceBorderColor: "rgba(186, 230, 253, 0.82)",
      textColor: "#0c4a6e",
      mutedTextColor: "#47728a",
      buttonColor: "#0369a1",
      buttonTextColor: "#f0f9ff",
      buttonBorderColor: "#7dd3fc",
      iconColor: "#e0f2fe",
      iconTextColor: "#0369a1",
      sectionColor: "rgba(224, 242, 254, 0.88)",
      sectionBorderColor: "rgba(56, 189, 248, 0.28)",
    },
  },
  {
    id: "preset:emerald-lantern-garland",
    name: "Đèn lồng rừng xanh",
    category: "holiday",
    imageUrl: "/assets/images/bios/27-emerald-lantern-garland-9x16.jpg",
    theme: {
      accentColor: "#fbbf24",
      surfaceColor: "rgba(4, 47, 46, 0.90)",
      surfaceBorderColor: "rgba(52, 211, 153, 0.30)",
      textColor: "#ecfdf5",
      mutedTextColor: "#a7f3d0",
      buttonColor: "#fef3c7",
      buttonTextColor: "#064e3b",
      buttonBorderColor: "#fcd34d",
      iconColor: "#fde68a",
      iconTextColor: "#065f46",
      sectionColor: "rgba(6, 78, 59, 0.76)",
      sectionBorderColor: "rgba(52, 211, 153, 0.30)",
    },
  },
  {
    id: "preset:midnight-red-garland",
    name: "Vòng lá đỏ",
    category: "holiday",
    imageUrl: "/assets/images/bios/28-midnight-red-garland-9x16.jpg",
    theme: {
      accentColor: "#fb7185",
      surfaceColor: "rgba(2, 36, 43, 0.91)",
      surfaceBorderColor: "rgba(251, 113, 133, 0.34)",
      textColor: "#fff1f2",
      mutedTextColor: "#fecdd3",
      buttonColor: "#be123c",
      buttonTextColor: "#fff1f2",
      buttonBorderColor: "#fda4af",
      iconColor: "#ffe4e6",
      iconTextColor: "#9f1239",
      sectionColor: "rgba(76, 5, 25, 0.72)",
      sectionBorderColor: "rgba(251, 113, 133, 0.30)",
    },
  },
  {
    id: "preset:forest-gold-garland",
    name: "Vòng lá ánh kim",
    category: "holiday",
    imageUrl: "/assets/images/bios/29-forest-gold-garland-9x16.jpg",
    theme: {
      accentColor: "#d6ad55",
      surfaceColor: "rgba(3, 48, 34, 0.91)",
      surfaceBorderColor: "rgba(214, 173, 85, 0.38)",
      textColor: "#fffbea",
      mutedTextColor: "#e8d7a6",
      buttonColor: "#d6ad55",
      buttonTextColor: "#173c2c",
      buttonBorderColor: "#f5d98f",
      iconColor: "#fff1bd",
      iconTextColor: "#24513c",
      sectionColor: "rgba(6, 78, 59, 0.76)",
      sectionBorderColor: "rgba(214, 173, 85, 0.32)",
    },
  },
];

export function getBioBackgroundPresetById(id?: string | null) {
  return bioBackgroundPresets.find((preset) => preset.id === id);
}

export function getBioBackgroundPresetByImage(imageUrl?: string | null) {
  return bioBackgroundPresets.find((preset) => preset.imageUrl === imageUrl);
}

export function getBioPresetTheme(
  presetId?: string | null,
  backgroundImage?: string | null,
  legacyAccentColor?: string | null,
): BioBackgroundPresetTheme {
  const presetTheme = (
    getBioBackgroundPresetById(presetId) ||
    getBioBackgroundPresetByImage(backgroundImage)
  )?.theme;

  if (presetTheme) return presetTheme;

  const legacyAccent = legacyAccentColor && /^#[0-9a-f]{6}$/i.test(legacyAccentColor)
    && legacyAccentColor.toLowerCase() !== "#ffffff"
    ? legacyAccentColor
    : undefined;

  return legacyAccent
    ? {
      ...defaultBioPresetTheme,
      accentColor: legacyAccent,
      buttonColor: legacyAccent,
      buttonBorderColor: legacyAccent,
      iconTextColor: legacyAccent,
    }
    : defaultBioPresetTheme;
}
