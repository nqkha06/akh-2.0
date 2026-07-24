export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PageFeaturedImage = {
  id: string;
  fileName: string;
  mimeType: string;
  extension: string;
  url: string;
};

export type AdminPage = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string;
  status: PageStatus;
  featuredImageId: string | null;
  featuredImage: PageFeaturedImage | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminPageListItem = Omit<
  AdminPage,
  "contentJson" | "contentHtml"
>;

export type AdminPagePayload = {
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string;
  featuredImageId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  sortOrder: number;
  status?: PageStatus;
};

export type NestPaginatedPagesResponse = {
  items: AdminPageListItem[];
  data: AdminPageListItem[];
  page: number;
  limit: number;
  perPage: number;
  total: number;
  pageCount: number;
};

export type AdminPagesTableData = {
  data: AdminPageListItem[];
  pageCount: number;
  total: number;
};
