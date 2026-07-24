import "flag-icons/css/flag-icons.min.css";

import { LinksView } from "@/features/links/components/links-page";
import { getMemberMonetizationLevels } from "@/features/member-monetization-levels/api/levels.server";

export default async function MemberLinksPage() {
  const monetizationLevels = await getMemberMonetizationLevels();

  return <LinksView monetizationLevels={monetizationLevels} />;
}
