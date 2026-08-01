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
  accentColor: string;
};

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
    accentColor: "#f9736a",
  },
  {
    id: "preset:retro-desktop",
    name: "Desktop hoài cổ",
    category: "retro",
    imageUrl: "/assets/images/bios/22-retro-desktop-9x16.jpg",
    accentColor: "#72b8b0",
  },
  {
    id: "preset:orange-sparkles",
    name: "Lấp lánh cam",
    category: "abstract",
    imageUrl: "/assets/images/bios/23-orange-sparkles-9x16.jpg",
    accentColor: "#fb8c22",
  },
  {
    id: "preset:crimson-lantern-glow",
    name: "Đèn lồng đỏ",
    category: "holiday",
    imageUrl: "/assets/images/bios/24-crimson-lantern-glow-9x16.jpg",
    accentColor: "#9f1717",
  },
  {
    id: "preset:cobalt-snowfall",
    name: "Tuyết xanh cobalt",
    category: "winter",
    imageUrl: "/assets/images/bios/25-cobalt-snowfall-9x16.jpg",
    accentColor: "#1554b8",
  },
  {
    id: "preset:arctic-mist-snowflakes",
    name: "Sương tuyết Bắc Cực",
    category: "winter",
    imageUrl: "/assets/images/bios/26-arctic-mist-snowflakes-9x16.jpg",
    accentColor: "#9bd9f2",
  },
  {
    id: "preset:emerald-lantern-garland",
    name: "Đèn lồng rừng xanh",
    category: "holiday",
    imageUrl: "/assets/images/bios/27-emerald-lantern-garland-9x16.jpg",
    accentColor: "#0b5b45",
  },
  {
    id: "preset:midnight-red-garland",
    name: "Vòng lá đỏ",
    category: "holiday",
    imageUrl: "/assets/images/bios/28-midnight-red-garland-9x16.jpg",
    accentColor: "#8d1824",
  },
  {
    id: "preset:forest-gold-garland",
    name: "Vòng lá ánh kim",
    category: "holiday",
    imageUrl: "/assets/images/bios/29-forest-gold-garland-9x16.jpg",
    accentColor: "#a97b2e",
  },
];

export function getBioBackgroundPresetById(id?: string | null) {
  return bioBackgroundPresets.find((preset) => preset.id === id);
}
