import type { PageStatus } from "@/features/admin-pages/types";

export function publicPagePath(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)
    ? `/${normalized}`
    : null;
}

export function canViewPublicPage(page: {
  slug: string;
  status: PageStatus;
}) {
  return page.status === "PUBLISHED" && publicPagePath(page.slug) !== null;
}

export function absolutePublicPageUrl(slug: string) {
  const path = publicPagePath(slug);
  if (!path || typeof window === "undefined") return null;
  return new URL(path, window.location.origin).toString();
}

export async function copyPublicPageUrl(slug: string) {
  const url = absolutePublicPageUrl(slug);
  if (!url) throw new Error("Public page URL is unavailable");

  try {
    await navigator.clipboard.writeText(url);
    return url;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Unable to copy public page URL");
    return url;
  }
}
