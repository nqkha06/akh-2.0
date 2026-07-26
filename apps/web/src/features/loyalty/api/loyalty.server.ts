import "server-only";

import type { MemberLoyaltyData } from "@/features/loyalty/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getMemberLoyalty(locale: string) {
  const searchParams = new URLSearchParams({ locale });
  const response = await serverApiFetch(
    `/member/loyalty?${searchParams.toString()}`,
    { cache: "no-store" },
    "/member/loyalty",
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as MemberLoyaltyData;
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
