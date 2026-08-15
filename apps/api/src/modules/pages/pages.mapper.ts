import { parsePageContent, sanitizePageContent } from "./pages-content";
import type { PageRecord, PublicPageRecord } from "./pages.select";

export function mapPageListItem(page: PageRecord) {
  const { contentJson: _json, contentHtml: _html, ...rest } = page;
  return rest;
}

export function mapPageDetail(page: PageRecord) {
  return {
    ...page,
    contentJson: parsePageContent(page.contentJson),
  };
}

export function mapPublicPage(page: PublicPageRecord) {
  return {
    ...page,
    contentHtml: sanitizePageContent(page.contentHtml),
  };
}
