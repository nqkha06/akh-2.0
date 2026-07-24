import "server-only";

import type { MemberMonetizationLevelsResponse } from "@/features/member-monetization-levels/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getMemberMonetizationLevels(): Promise<MemberMonetizationLevelsResponse> {
  const response = await serverApiFetch(
    "/member/monetization-levels",
    { cache: "no-store" },
    "/member/links",
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as MemberMonetizationLevelsResponse;
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
