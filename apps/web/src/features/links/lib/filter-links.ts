import type { LinkDto } from "@/lib/api-client";
import type { LinkFilters, LinkSort } from "../types";

function linkMatchesQuery(link: LinkDto, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const searchableText = [
    link.title,
    link.slug,
    link.shortUrl,
    link.destinationUrl,
    link.destinationFileName,
    link.subtitle,
    link.status,
    link.inputType,
    ...link.actions.flatMap((action) => [action.platform, action.action, action.url]),
  ].filter(Boolean).join(" ").toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function isWithinDateRange(link: LinkDto, createdFrom: string, createdTo: string) {
  const createdTime = new Date(link.createdAt).getTime();
  if (createdFrom && createdTime < new Date(`${createdFrom}T00:00:00`).getTime()) return false;
  if (createdTo && createdTime > new Date(`${createdTo}T23:59:59`).getTime()) return false;
  return true;
}

export function filterLinks(links: LinkDto[], filters: LinkFilters) {
  const minClicks = Number(filters.minClicks);

  return links.filter((link) => {
    if (!linkMatchesQuery(link, filters.query)) return false;
    if (filters.status !== "all" && link.status !== filters.status) return false;
    if (filters.inputType !== "all" && link.inputType !== filters.inputType) return false;
    if (filters.platform !== "all" && !link.actions.some((action) => action.platform === filters.platform)) return false;
    if (!isWithinDateRange(link, filters.createdFrom, filters.createdTo)) return false;
    if (filters.minClicks && !Number.isNaN(minClicks) && link.views < minClicks) return false;
    if (filters.highPerformance && link.views < 500) return false;
    return true;
  });
}

export function sortLinks(links: LinkDto[], sort: LinkSort) {
  return [...links].sort((first, second) => {
    if (sort === "oldest") return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
    if (sort === "clicks-desc") return second.views - first.views;
    if (sort === "title-asc") return first.title.localeCompare(second.title);
    if (sort === "actions-desc") return second.actions.length - first.actions.length;
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}
