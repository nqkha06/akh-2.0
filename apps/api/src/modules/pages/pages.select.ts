import { Prisma } from "@prisma/client";

export const PAGE_FEATURED_IMAGE_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  extension: true,
  url: true,
} satisfies Prisma.AdminMediaSelect;

export const PAGE_INCLUDE = {
  featuredImage: { select: PAGE_FEATURED_IMAGE_SELECT },
} satisfies Prisma.PageInclude;

export const PUBLIC_PAGE_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  contentHtml: true,
  featuredImage: { select: PAGE_FEATURED_IMAGE_SELECT },
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  canonicalUrl: true,
  robotsIndex: true,
  robotsFollow: true,
  publishedAt: true,
} satisfies Prisma.PageSelect;

export type PageRecord = Prisma.PageGetPayload<{
  include: typeof PAGE_INCLUDE;
}>;

export type PublicPageRecord = Prisma.PageGetPayload<{
  select: typeof PUBLIC_PAGE_SELECT;
}>;
