import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { LoyaltyView } from "@/components/dashboard/views/loyalty";
import { getMemberLoyalty } from "@/features/loyalty/api/loyalty.server";

export const metadata: Metadata = {
  title: "Thân thiết",
};

export default async function MemberLoyaltyPage() {
  const locale = await getLocale();
  const data = await getMemberLoyalty(locale);
  return <LoyaltyView data={data} />;
}
