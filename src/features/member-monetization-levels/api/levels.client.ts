"use client";

import { authenticatedApiFetch } from "@/lib/api-client";

export async function selectMemberMonetizationLevel(
  monetizationLevelId: number,
) {
  const response = await authenticatedApiFetch(
    "/member/monetization-levels/selection",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monetizationLevelId }),
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as {
    monetizationLevelId: number;
    usesSystemDefault: false;
  };
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
