import { AccountView } from "@/components/dashboard/views/account";
import { getReferralsDashboard } from "@/features/referrals/api/referrals.server";

export default async function MemberAccountPage() {
  const referrals = await getReferralsDashboard("/member/account");
  return <AccountView referrals={referrals} />;
}
