"use client";

import type { AdminBusinessSettings } from "../types";
import { authenticatedApiFetch } from "@/lib/api-client";

export type UpdateBusinessSettingsInput = Omit<
  AdminBusinessSettings,
  "updatedAt" | "currencies" | "uiLanguages"
>;

export async function updateBusinessSettings(values: UpdateBusinessSettingsInput) {
  const response = await authenticatedApiFetch("/admin/settings/business", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminBusinessSettings;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      error?: { message?: string };
    };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || body.error?.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
