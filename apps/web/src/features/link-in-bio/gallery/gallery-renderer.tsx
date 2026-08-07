"use client";
/* eslint-disable @next/next/no-img-element */

import { ImageOff } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { BioGalleryBlockDto, BioGalleryImageDto } from "@/lib/api-client";
import { getGalleryLayoutModel } from "./gallery-types";

function imageFrameStyle(
  gallery: BioGalleryBlockDto,
  image: BioGalleryImageDto,
): CSSProperties | undefined {
  if (gallery.aspectRatio !== "original") return undefined;
  if (image.width && image.height) return { aspectRatio: `${image.width} / ${image.height}` };
  return { aspectRatio: "1 / 1" };
}

function GalleryImageFrame({
  gallery,
  image,
  onExternalLink,
}: {
  gallery: BioGalleryBlockDto;
  image: BioGalleryImageDto;
  onExternalLink?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const layout = getGalleryLayoutModel(gallery);
  const imageContent = (
    <>
      <span
        className={cn(
          "relative block min-h-20 overflow-hidden bg-muted/45",
          layout.aspectClass,
          layout.radiusClass,
          layout.frameClass,
        )}
        style={imageFrameStyle(gallery, image)}
      >
        {failed ? (
          <span className="absolute inset-0 grid place-items-center text-muted-foreground">
            <span className="text-center text-xs">
              <ImageOff className="mx-auto mb-1.5 size-5" aria-hidden />
              Ảnh không khả dụng
            </span>
          </span>
        ) : (
          <img
            src={image.thumbnailUrl || image.url}
            alt={image.alt || image.caption || ""}
            width={image.width || 800}
            height={image.height || 800}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            onError={() => setFailed(true)}
            className={cn(
              "absolute inset-0 size-full",
              gallery.aspectRatio === "original" ? "object-contain" : "object-cover",
              "transition-transform duration-300 motion-reduce:transition-none group-hover/gallery-image:scale-[1.02]",
            )}
          />
        )}
        {gallery.showCaption && image.caption ? (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-2 pt-8 text-left text-xs font-medium leading-5 text-white">
            {image.caption}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!image.linkUrl) return <div className="group/gallery-image">{imageContent}</div>;

  return (
    <a
      href={image.linkUrl}
      target={image.openInNewTab ? "_blank" : undefined}
      rel={image.openInNewTab ? "noopener noreferrer" : undefined}
      onClick={onExternalLink}
      className="group/gallery-image block rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bio-accent)] focus-visible:ring-offset-2"
      aria-label={image.alt || image.caption || "Mở liên kết ảnh"}
    >
      {imageContent}
    </a>
  );
}

export function GalleryRenderer({
  gallery,
  onExternalLink,
  emptyState,
  className,
}: {
  gallery: BioGalleryBlockDto;
  onExternalLink?: () => void;
  emptyState?: ReactNode;
  className?: string;
}) {
  if (!gallery.enabled) return null;
  const images = [...gallery.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const layout = getGalleryLayoutModel(gallery);

  return (
    <section className={cn("min-w-0", className)} aria-label={gallery.title || "Bộ sưu tập ảnh"}>
      {gallery.showTitle && gallery.title ? (
        <h2 className="mb-2.5 px-0.5 text-sm font-semibold tracking-tight text-[color:var(--bio-text,var(--foreground))]">
          {gallery.title}
        </h2>
      ) : null}
      {images.length === 0 ? emptyState || null : gallery.displayMode === "slider" ? (
        <Carousel opts={{ align: "start", dragFree: true }} className="group/gallery-carousel px-0.5" aria-label={gallery.title || "Bộ sưu tập ảnh"}>
          <CarouselContent className={layout.carouselGapClass}>
            {images.map((image) => (
              <CarouselItem key={image.id} className={cn(layout.carouselItemGapClass, layout.sliderBasisClass)}>
                <GalleryImageFrame gallery={gallery} image={image} onExternalLink={onExternalLink} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious type="button" className="left-2 hidden border-border/70 bg-background/90 shadow-sm backdrop-blur sm:inline-flex" />
          <CarouselNext type="button" className="right-2 hidden border-border/70 bg-background/90 shadow-sm backdrop-blur sm:inline-flex" />
        </Carousel>
      ) : (
        <div className={cn("grid", layout.gridColumnsClass, layout.gapClass)}>
          {images.map((image) => (
            <GalleryImageFrame key={image.id} gallery={gallery} image={image} onExternalLink={onExternalLink} />
          ))}
        </div>
      )}
    </section>
  );
}
