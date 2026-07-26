import "server-only";

import { cache } from "react";

import type { PublicPayoutRateLevel } from "@/features/public-payout-rates/types";

export const getPublicPayoutRates = cache(
  async (levelId: number): Promise<PublicPayoutRateLevel | null> => {
    const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
    if (!backendApiUrl) return null;

    try {
      const response = await fetch(
        `${backendApiUrl}/public/monetization-levels/${levelId}/payout-rates`,
        { next: { revalidate: 60, tags: [`public-payout-rates-${levelId}`] } },
      );
      if (!response.ok) return null;
      return (await response.json()) as PublicPayoutRateLevel;
    } catch {
      return null;
    }
  },
);
