"use client";

import type {
  AdminMedia,
  AdminMediaFolder,
  AdminMediaQuery,
  AdminMediaResponse,
} from "@/features/admin-media/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export async function getAdminMedia(params: AdminMediaQuery = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);
  if (params.folderId !== undefined) {
    query.set("folderId", params.folderId ?? "root");
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  return request<AdminMediaResponse>(
    `/admin/media${query.size ? `?${query}` : ""}`,
  );
}

export function getAdminMediaById(id: string) {
  return request<AdminMedia>(`/admin/media/${encodeURIComponent(id)}`);
}

export async function uploadAdminMedia(
  files: File[],
  folderId?: string | null,
) {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  const query = new URLSearchParams({
    folderId: folderId || "root",
  });
  return request<{ items: AdminMedia[] }>(
    `/admin/media/upload?${query}`,
    { method: "POST", body },
  );
}

export function updateAdminMedia(
  id: string,
  payload: {
    fileName?: string;
    altText?: string | null;
    caption?: string | null;
  },
) {
  return jsonRequest<AdminMedia>(
    `/admin/media/${encodeURIComponent(id)}`,
    "PATCH",
    payload,
  );
}

export function moveAdminMedia(id: string, folderId: string | null) {
  return jsonRequest<AdminMedia>(
    `/admin/media/${encodeURIComponent(id)}/move`,
    "PATCH",
    { folderId },
  );
}

export function bulkMoveAdminMedia(ids: string[], folderId: string | null) {
  return jsonRequest<{ moved: number; folderId: string | null }>(
    "/admin/media/bulk-move",
    "POST",
    { ids, folderId },
  );
}

export function deleteAdminMedia(id: string) {
  return request<{ id: string; deleted: true }>(
    `/admin/media/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function bulkDeleteAdminMedia(ids: string[]) {
  return jsonRequest<{ deleted: number }>(
    "/admin/media/bulk-delete",
    "POST",
    { ids },
  );
}

export async function getAdminMediaFolders() {
  return request<{ items: AdminMediaFolder[] }>("/admin/media/folders");
}

export function createAdminMediaFolder(payload: {
  name: string;
  parentId?: string | null;
}) {
  return jsonRequest<AdminMediaFolder>(
    "/admin/media/folders",
    "POST",
    payload,
  );
}

export function updateAdminMediaFolder(
  id: string,
  payload: { name?: string; parentId?: string | null },
) {
  return jsonRequest<AdminMediaFolder>(
    `/admin/media/folders/${encodeURIComponent(id)}`,
    "PATCH",
    payload,
  );
}

export function deleteAdminMediaFolder(id: string) {
  return request<{ id: string; deleted: true }>(
    `/admin/media/folders/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

async function jsonRequest<T>(
  path: string,
  method: "POST" | "PATCH",
  body: object,
) {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await authenticatedApiFetch(path, init);
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as T;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as {
      code?: string;
      message?: string | string[];
    };
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    return message || body.code || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
