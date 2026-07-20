import "server-only";

import type { AdminWebsiteSettings } from "@/features/site-settings/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getAdminAppearanceSettings() {
  const response = await serverApiFetch(
    "/admin/settings/appearance",
    { cache: "no-store" },
    "/admin/settings/appearance",
  );
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
