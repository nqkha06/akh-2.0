export type PublicPageFeaturedImage = {
  id: string;
  fileName: string;
  mimeType: string;
  extension: string;
  url: string;
};

export type PublicPage = {
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  featuredImage: PublicPageFeaturedImage | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  publishedAt: string | null;
};
