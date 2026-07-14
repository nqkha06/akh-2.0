import type { BioPageDto, CreateBioPagePayload } from "@/lib/api-client"

export type BioStatusFilter = "all" | "published" | "draft" | "paused"
export type BioSort = "updated" | "oldest" | "views" | "ctr" | "name"

export function getBioCtr(page: Pick<BioPageDto, "views" | "clicks">) {
  return page.views > 0 ? (page.clicks / page.views) * 100 : 0
}

export function getVisibleBioLinks(page: BioPageDto) {
  return page.customLinks.filter((link) => !page.hiddenLinks.includes(link.id)).length
}

export function bioPageToPayload(
  page: BioPageDto,
  overrides: Partial<CreateBioPagePayload> = {},
): CreateBioPagePayload {
  return {
    name: page.name,
    title: page.title || undefined,
    customSlug: page.slug,
    status: page.status === "draft" ? "draft" : "published",
    socialLinks: page.socialLinks,
    customLinks: page.customLinks,
    widgets: page.widgets,
    hiddenLinks: page.hiddenLinks,
    appearance: page.appearance,
    ...overrides,
  }
}

