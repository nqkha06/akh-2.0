import type { PageStatus } from "../pages.constants";

export class PageEntity {
  id!: number;
  title!: string;
  slug!: string;
  excerpt!: string | null;
  contentJson!: Record<string, unknown>;
  contentHtml!: string;
  status!: PageStatus;
  featuredImageId!: string | null;
  seoTitle!: string | null;
  seoDescription!: string | null;
  seoKeywords!: string | null;
  canonicalUrl!: string | null;
  robotsIndex!: boolean;
  robotsFollow!: boolean;
  sortOrder!: number;
  publishedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
