import type {
  BioContentOrderItemDto,
  BioGalleryBlockDto,
  BioGalleryImageDto,
} from "@/lib/api-client";

export const GALLERY_MAX_IMAGES = 20;
export const GALLERY_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
export const GALLERY_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;
export const GALLERY_FILE_ACCEPT = GALLERY_ACCEPTED_MIME_TYPES.join(",");

export const DEFAULT_GALLERY_CONFIG = {
  showTitle: true,
  enabled: true,
  displayMode: "grid",
  aspectRatio: "1:1",
  columns: { mobile: 2, tablet: 3, desktop: 3 },
  gap: "md",
  radius: "md",
  showCaption: false,
  border: "none",
  shadow: "none",
} as const satisfies Omit<BioGalleryBlockDto, "id" | "type" | "images">;

export function createGalleryBlock(id: string): BioGalleryBlockDto {
  return {
    id,
    type: "gallery",
    title: "Bộ sưu tập",
    ...DEFAULT_GALLERY_CONFIG,
    columns: { ...DEFAULT_GALLERY_CONFIG.columns },
    images: [],
  };
}

export function normalizeGalleryImages(images: BioGalleryImageDto[]) {
  return images.map((image, sortOrder) => ({ ...image, sortOrder }));
}

export function contentOrderKey(item: BioContentOrderItemDto) {
  return `${item.type}:${item.id}`;
}

export function buildDefaultContentOrder(input: {
  socials?: Array<{ id: string }>;
  widgets: Array<{ id: string }>;
  galleries: Array<{ id: string }>;
  dividers?: Array<{ id: string }>;
  bankDetails?: Array<{ id: string }>;
  links: Array<{ id: string }>;
}): BioContentOrderItemDto[] {
  return [
    ...(input.socials?.length ? [{ type: "social" as const, id: "socials" }] : []),
    ...input.widgets.map(({ id }) => ({ type: "widget" as const, id })),
    ...input.galleries.map(({ id }) => ({ type: "gallery" as const, id })),
    ...(input.dividers || []).map(({ id }) => ({ type: "divider" as const, id })),
    ...(input.bankDetails || []).map(({ id }) => ({ type: "bank-details" as const, id })),
    ...input.links.map(({ id }) => ({ type: "link" as const, id })),
  ];
}

export function normalizeContentOrder(
  order: BioContentOrderItemDto[] | undefined,
  input: {
    socials?: Array<{ id: string }>;
    widgets: Array<{ id: string }>;
    galleries: Array<{ id: string }>;
    dividers?: Array<{ id: string }>;
    bankDetails?: Array<{ id: string }>;
    links: Array<{ id: string }>;
  },
) {
  const fallback = buildDefaultContentOrder(input);
  const validItems = new Map(fallback.map((item) => [contentOrderKey(item), item]));
  const seen = new Set<string>();
  const result: BioContentOrderItemDto[] = [];

  for (const item of order || []) {
    const key = contentOrderKey(item);
    const valid = validItems.get(key);
    if (!valid || seen.has(key)) continue;
    seen.add(key);
    result.push(valid);
  }

  for (const item of fallback) {
    const key = contentOrderKey(item);
    if (!seen.has(key)) result.push(item);
  }

  return result;
}

export type GalleryLayoutModel = {
  gridColumnsClass: string;
  sliderBasisClass: string;
  gapClass: string;
  carouselGapClass: string;
  carouselItemGapClass: string;
  aspectClass: string;
  radiusClass: string;
  frameClass: string;
};

export function getGalleryLayoutModel(
  gallery: Pick<
    BioGalleryBlockDto,
    "columns" | "gap" | "aspectRatio" | "radius" | "border" | "shadow"
  >,
): GalleryLayoutModel {
  const mobile = Math.min(3, Math.max(1, gallery.columns.mobile));
  const tablet = Math.min(4, Math.max(1, gallery.columns.tablet));
  const desktop = Math.min(6, Math.max(1, gallery.columns.desktop));
  const columnClasses = {
    mobile: ["", "grid-cols-1", "grid-cols-2", "grid-cols-3"],
    tablet: ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"],
    desktop: ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:grid-cols-6"],
  };
  const basisClasses = {
    mobile: ["", "basis-full", "basis-1/2", "basis-1/3"],
    tablet: ["", "sm:basis-full", "sm:basis-1/2", "sm:basis-1/3", "sm:basis-1/4"],
    desktop: ["", "lg:basis-full", "lg:basis-1/2", "lg:basis-1/3", "lg:basis-1/4", "lg:basis-1/5", "lg:basis-1/6"],
  };
  const gaps = {
    sm: { grid: "gap-1.5", content: "-ml-1.5", item: "pl-1.5" },
    md: { grid: "gap-3", content: "-ml-3", item: "pl-3" },
    lg: { grid: "gap-5", content: "-ml-5", item: "pl-5" },
  } as const;

  return {
    gridColumnsClass: `${columnClasses.mobile[mobile]} ${columnClasses.tablet[tablet]} ${columnClasses.desktop[desktop]}`,
    sliderBasisClass: `${basisClasses.mobile[mobile]} ${basisClasses.tablet[tablet]} ${basisClasses.desktop[desktop]}`,
    gapClass: gaps[gallery.gap].grid,
    carouselGapClass: gaps[gallery.gap].content,
    carouselItemGapClass: gaps[gallery.gap].item,
    aspectClass: gallery.aspectRatio === "4:5"
      ? "aspect-[4/5]"
      : gallery.aspectRatio === "16:9"
        ? "aspect-video"
        : gallery.aspectRatio === "original"
          ? ""
          : "aspect-square",
    radiusClass: {
      none: "rounded-none",
      sm: "rounded-md",
      md: "rounded-xl",
      lg: "rounded-2xl",
      full: "rounded-[2rem]",
    }[gallery.radius],
    frameClass: [
      gallery.border === "subtle" ? "border border-border/70" : "border border-transparent",
      gallery.shadow === "sm" ? "shadow-sm" : gallery.shadow === "md" ? "shadow-md" : "shadow-none",
    ].join(" "),
  };
}
