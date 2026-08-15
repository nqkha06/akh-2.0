export const PAGES_OPENAPI_ROUTE_SNAPSHOT = {
  "/api/admin/pages": ["get", "post"],
  "/api/admin/pages/{id}": ["delete", "get", "patch"],
  "/api/admin/pages/{id}/status": ["patch"],
  "/api/admin/pages/bulk": ["delete"],
  "/api/admin/pages/bulk/status": ["patch"],
  "/api/public/pages/{slug}": ["get"],
} as const;

export const PAGE_DETAIL_RESPONSE_KEYS = [
  "canonicalUrl",
  "contentHtml",
  "contentJson",
  "createdAt",
  "deletedAt",
  "excerpt",
  "featuredImage",
  "featuredImageId",
  "id",
  "publishedAt",
  "robotsFollow",
  "robotsIndex",
  "seoDescription",
  "seoKeywords",
  "seoTitle",
  "slug",
  "sortOrder",
  "status",
  "title",
  "updatedAt",
] as const;

export const PAGE_LIST_RESPONSE_KEYS = [
  "data",
  "filters",
  "items",
  "limit",
  "page",
  "pageCount",
  "perPage",
  "sort",
  "total",
] as const;

export const PAGE_LIST_ITEM_RESPONSE_KEYS = PAGE_DETAIL_RESPONSE_KEYS.filter(
  (key) => key !== "contentHtml" && key !== "contentJson",
);

export const PUBLIC_PAGE_RESPONSE_KEYS = [
  "canonicalUrl",
  "contentHtml",
  "excerpt",
  "featuredImage",
  "publishedAt",
  "robotsFollow",
  "robotsIndex",
  "seoDescription",
  "seoKeywords",
  "seoTitle",
  "slug",
  "title",
] as const;
