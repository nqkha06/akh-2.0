import "server-only";

import type { MemberMonetizationLevelsResponse } from "@/features/member-monetization-levels/types";
import { getServerSession } from "@/lib/auth/server-session";

const apiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");

export async function getMemberMonetizationLevels(): Promise<MemberMonetizationLevelsResponse> {
  const session = await getServerSession();
  if (!apiUrl || !session?.backendAccessToken) {
    throw new Error("Phiên thành viên không hợp lệ.");
  }

  const response = await fetch(`${apiUrl}/member/monetization-levels`, {
    headers: {
      Authorization: `Bearer ${session.backendAccessToken}`,
    },
    cache: "no-store",
  });

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
