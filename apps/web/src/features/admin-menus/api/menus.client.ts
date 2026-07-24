"use client";

import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  LanguageOption,
  PageOption,
  WebsiteMenu,
  WebsiteMenuItem,
  WebsiteMenuLocation,
  WebsiteMenusResponse,
} from "../types";

async function request<T>(path: string, init?: RequestInit) {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || "Yêu cầu không thành công.";
  } catch {
    return "Yêu cầu không thành công.";
  }
}

export function getMenus() {
  return request<WebsiteMenusResponse>("/admin/menus");
}

export function getMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}`);
}

export function createMenu(payload: {
  key: string;
  name: string;
  description?: string;
  translations: Array<{ locale: string; title?: string }>;
}) {
  return request<WebsiteMenu>("/admin/menus", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMenu(
  id: number,
  payload: {
    name?: string;
    description?: string;
    translations?: Array<{ locale: string; title?: string }>;
  },
) {
  return request<WebsiteMenu>(`/admin/menus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function saveMenuTree(
  id: number,
  expectedVersion: number,
  items: WebsiteMenuItem[],
) {
  return request<WebsiteMenu>(`/admin/menus/${id}/tree`, {
    method: "PUT",
    body: JSON.stringify({
      expectedVersion,
      items: items.map(toTreePayload),
    }),
  });
}

export function publishMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}/publish`, {
    method: "POST",
  });
}

export function unpublishMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}/unpublish`, {
    method: "POST",
  });
}

export function duplicateMenu(id: number) {
  return request<WebsiteMenu>(`/admin/menus/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteMenu(id: number) {
  return request<{ success: true; id: number }>(`/admin/menus/${id}`, {
    method: "DELETE",
  });
}

export function assignMenuLocation(
  location: WebsiteMenuLocation,
  menuId: number,
) {
  return request("/admin/menus/locations", {
    method: "PATCH",
    body: JSON.stringify({ location, menuId }),
  });
}

export function unassignMenuLocation(location: WebsiteMenuLocation) {
  return request(`/admin/menus/locations/${location}`, {
    method: "DELETE",
  });
}

export function getMenuEditorOptions() {
  return Promise.all([
    request<{ items: LanguageOption[] }>("/admin/languages"),
    request<{ items: PageOption[] }>("/admin/pages?perPage=100&page=1"),
  ]).then(([languages, pages]) => ({
    languages: languages.items,
    pages: pages.items,
  }));
}

type MenuTreePayload = {
  id?: number;
  type: WebsiteMenuItem["type"];
  pageId?: number;
  url?: string;
  target: WebsiteMenuItem["target"];
  rel?: string;
  iconKey?: string;
  isEnabled: boolean;
  translations: Array<{
    locale: string;
    label: string;
    title?: string;
    ariaLabel?: string;
    urlOverride?: string;
  }>;
  children: MenuTreePayload[];
};

function toTreePayload(item: WebsiteMenuItem): MenuTreePayload {
  return {
    ...(item.id > 0 ? { id: item.id } : {}),
    type: item.type,
    ...(item.pageId ? { pageId: item.pageId } : {}),
    ...(item.url ? { url: item.url } : {}),
    target: item.target,
    ...(item.rel ? { rel: item.rel } : {}),
    ...(item.iconKey ? { iconKey: item.iconKey } : {}),
    isEnabled: item.isEnabled,
    translations: item.translations.map((translation) => ({
      locale: translation.locale,
      label: translation.label,
      ...(translation.title ? { title: translation.title } : {}),
      ...(translation.ariaLabel
        ? { ariaLabel: translation.ariaLabel }
        : {}),
      ...(translation.urlOverride
        ? { urlOverride: translation.urlOverride }
        : {}),
    })),
    children: item.children.map(toTreePayload),
  };
}
