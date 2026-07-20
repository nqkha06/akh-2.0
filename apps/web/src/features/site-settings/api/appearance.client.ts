"use client";

import type { AppearanceSettingsValues } from "@/features/site-settings/schemas/appearance-schema";
import type { AdminWebsiteSettings } from "@/features/site-settings/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export async function updateAppearanceSettings(
  values: AppearanceSettingsValues,
) {
  const response = await authenticatedApiFetch("/admin/settings/appearance", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...values,
      siteShortName: values.siteShortName || null,
      siteDescription: values.siteDescription || null,
      siteTagline: values.siteTagline || null,
      siteUrl: values.siteUrl || null,
      contactEmail: values.contactEmail || null,
      supportEmail: values.supportEmail || null,
      phone: values.phone || null,
      address: values.address || null,
      workingHours: values.workingHours || null,
      mapUrl: values.mapUrl || null,
    }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminWebsiteSettings;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
