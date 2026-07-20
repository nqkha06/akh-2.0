import type { Metadata } from "next";

import { getReferralsDashboard } from "@/features/referrals/api/referrals.server";
import { ReferralsView } from "@/features/referrals/components/referrals-view";

export const metadata: Metadata = {
  title: "Giới thiệu",
};

export default async function MemberReferralsPage() {
  const data = await getReferralsDashboard();
  return <ReferralsView data={data} />;
}
