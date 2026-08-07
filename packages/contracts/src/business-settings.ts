export const FALLBACK_BASE_CURRENCY_CODE = "USD";

export const DEFAULT_UPLOAD_LIMITS = {
  memberFileMaxBytes: 100 * 1024 * 1024,
  coverImageMaxBytes: 10 * 1024 * 1024,
  adminMediaMaxBytes: 10 * 1024 * 1024,
  supportAttachmentMaxBytes: 5 * 1024 * 1024,
  memberStorageQuotaBytes: 1024 * 1024 * 1024,
} as const;

// Transport ceilings only. Effective limits come from Business Settings.
export const ABSOLUTE_HTTP_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;
export const ABSOLUTE_MEMBER_UPLOAD_MAX_BYTES = 1024 * 1024 * 1024;

// These locales ship with complete JSON catalogs. Additional published locales
// are loaded from the database and fall back to English for untranslated keys.
export const BUNDLED_UI_LOCALES = ["vi", "en"] as const;
export type BundledUiLocale = (typeof BUNDLED_UI_LOCALES)[number];

export const DEVICE_TYPE_CODES = {
  mobile: 1,
  desktop: 2,
  tablet: 3,
} as const;

export type DeviceTypeName = keyof typeof DEVICE_TYPE_CODES;

export const DEVICE_TYPE_NAMES: Record<number, DeviceTypeName | "unknown"> = {
  [DEVICE_TYPE_CODES.mobile]: "mobile",
  [DEVICE_TYPE_CODES.desktop]: "desktop",
  [DEVICE_TYPE_CODES.tablet]: "tablet",
};

export type BackgroundImagePreset = {
  id: string;
  name: string;
  imageUrl: string;
  categories: string[];
  enabled: boolean;
};

export type BackgroundVideoPreset = {
  id: string;
  name: string;
  source: string;
  sourceUrl: string;
  videoUrl: string;
  categories: string[];
  enabled: boolean;
};

const image = (
  id: string,
  name: string,
  photoId: string,
  categories: string[],
): BackgroundImagePreset => ({
  id,
  name,
  imageUrl: `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=80`,
  categories,
  enabled: true,
});

export const DEFAULT_BACKGROUND_IMAGE_PRESETS: BackgroundImagePreset[] = [
  image("1", "Neon Flow", "1545239351-1141bd82e8a6", ["Abstract", "Gradient"]),
  image("2", "Aurora Mist", "1515405295579-ba7b45403062", ["Gradient", "Nature"]),
  image("3", "Cosmic Dust", "1557683316-973673baf926", ["Abstract", "Tech"]),
  image("4", "Blue Mirage", "1557682250-33bd709cbe85", ["Abstract", "Gradient"]),
  image("5", "Glass Bloom", "1493246507139-91e8fad9978e", ["Texture", "Abstract"]),
  image("6", "Chromatic Wave", "1557682250-33bd709cbe85", ["Gradient", "Abstract"]),
  image("7", "Prism Haze", "1500375592092-40eb2168fd21", ["Abstract", "Geometric"]),
  image("8", "Liquid Light", "1516321318423-f06f85e504b3", ["Gradient", "Tech"]),
  image("9", "Velvet Pulse", "1528459801416-a9e53bbf4e17", ["Texture", "Abstract"]),
  image("10", "Soft Glow", "1500462918059-b1a0cb512f1d", ["Gradient", "Minimal"]),
  image("11", "Satin Wave", "1513151233558-d860c5398176", ["Abstract", "Texture"]),
  image("12", "Inferno Bloom", "1526318472351-c75fcf070305", ["Abstract", "Gradient"]),
  image("13", "Candy Cloud", "1526318472351-c75fcf070305", ["Gradient", "Texture"]),
  image("14", "Golden Drift", "1519681393784-d120267933ba", ["Nature", "Texture"]),
  image("15", "Midnight Bloom", "1470770841072-f978cf4d019e", ["Nature", "Abstract"]),
  image("16", "Desert Halo", "1500530855697-b586d89ba3ee", ["Nature", "Minimal"]),
  image("17", "Tropical Echo", "1507525428034-b723cf961d3e", ["Nature"]),
  image("18", "Creator Desk", "1497366754035-f200968a6e72", ["Creator", "Workspace"]),
  image("19", "Glass Geometry", "1518005020951-eccb494ad742", ["Geometric", "Professional"]),
  image("20", "Aurora Gradient", "1557683316-973673baf926", ["Gradient", "Abstract"]),
  image("21", "Minimal Studio", "1497215728101-856f4ea42174", ["Workspace", "Professional"]),
  image("22", "Digital Workspace", "1516321318423-f06f85e504b3", ["Tech", "Workspace"]),
];

export const DEFAULT_BACKGROUND_VIDEO_PRESETS: BackgroundVideoPreset[] = [
  { id: "coverr-ai-gradient", name: "Soft AI Gradient", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/abstract", videoUrl: "https://cdn.coverr.co/videos/user-ai-generation-kv9zE4fNgqFS/1080p.mp4", categories: ["Abstract", "Gradient"], enabled: true },
  { id: "coverr-luminous-flow", name: "Luminous Flow", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/abstract", videoUrl: "https://cdn.coverr.co/videos/user-ai-generation-VlzTMEbjgVkr/1080p.mp4", categories: ["Abstract", "Gradient"], enabled: true },
  { id: "coverr-mountain-focus", name: "Creator Journey", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/background", videoUrl: "https://cdn.coverr.co/videos/coverr-walking-to-the-mountain-top-8360/1080p.mp4", categories: ["Creator", "Nature"], enabled: true },
  { id: "coverr-water-calm", name: "Calm Reflection", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/background", videoUrl: "https://cdn.coverr.co/videos/coverr-tree-reflection-in-the-water-8825/360p.mp4", categories: ["Nature", "Minimal"], enabled: true },
  { id: "coverr-phone-focus", name: "Mobile Creator", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/technology", videoUrl: "https://cdn.coverr.co/videos/coverr-close-up-of-man-using-iphone-15/360p.mp4", categories: ["Tech", "Creator"], enabled: true },
  { id: "coverr-industrial-grid", name: "Grid Reflection", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/industrial", videoUrl: "https://cdn.coverr.co/videos/coverr-river-viewed-through-a-square-grid-6554/1080p.mp4", categories: ["Geometric", "Texture"], enabled: true },
  { id: "coverr-studio-phone", name: "Studio Tech", source: "Coverr", sourceUrl: "https://coverr.co/stock-video-footage/technology", videoUrl: "https://cdn.coverr.co/videos/coverr-close-up-of-iphone-15/360p.mp4", categories: ["Tech", "Professional"], enabled: true },
];

export const DEFAULT_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "text/plain",
] as const;
