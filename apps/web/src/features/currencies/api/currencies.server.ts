import "server-only";

import { serverApiFetch } from "@/lib/auth/server-access";

import type {
  AdminCurrenciesResponse,
  MemberCurrencyPreferences,
} from "../types";

export async function getAdminCurrencies(
  callbackUrl = "/admin/settings/currencies",
) {
  const response = await serverApiFetch(
    "/admin/settings/currencies",
    { cache: "no-store" },
    callbackUrl,
  );
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AdminCurrenciesResponse;
}

export async function getMemberCurrencyPreferences(
  callbackUrl = "/member/account",
) {
  const response = await serverApiFetch(
    "/member/preferences/currency",
    { cache: "no-store" },
    callbackUrl,
  );
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as MemberCurrencyPreferences;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
