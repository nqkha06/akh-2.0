import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  Language,
  LanguagePayload,
  LanguagesResponse,
  PublicLanguagesResponse,
} from "../types";

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

export function getAdminLanguages() {
  return request<LanguagesResponse>("/admin/languages");
}

export function createLanguage(payload: LanguagePayload) {
  return request<Language>("/admin/languages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLanguage(
  id: number,
  payload: Partial<LanguagePayload>,
) {
  return request<Language>(`/admin/languages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setDefaultLanguage(id: number) {
  return request<Language>(`/admin/languages/${id}/default`, {
    method: "PATCH",
  });
}

export function reorderLanguages(
  items: Array<{ id: number; sortOrder: number }>,
) {
  return request<LanguagesResponse>("/admin/languages/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export function deleteLanguage(id: number) {
  return request<{ success: true; id: number }>(`/admin/languages/${id}`, {
    method: "DELETE",
  });
}

export async function getPublicLanguages() {
  const response = await fetch("/api/backend/languages", {
    credentials: "include",
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PublicLanguagesResponse;
}
