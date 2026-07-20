import { getMemberMonetizationLevels } from "@/features/member-monetization-levels/api/levels.server";
import { LevelsView } from "@/features/member-monetization-levels/components/levels-view";

export default async function MemberLevelsPage() {
  const data = await getMemberMonetizationLevels();
  return <LevelsView {...data} />;
}
