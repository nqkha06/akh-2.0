import "server-only";

import type { AdminBusinessSettings } from "../types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getAdminBusinessSettings() {
  const response = await serverApiFetch(
    "/admin/settings/business",
    { cache: "no-store" },
    "/admin/settings/business",
  );
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminBusinessSettings;
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
