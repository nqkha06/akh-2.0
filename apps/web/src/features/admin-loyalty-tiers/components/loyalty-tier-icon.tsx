import {
  Gem,
  ShieldCheck,
  Sparkles,
  Trophy,
  type LucideProps,
} from "lucide-react";

import type { LoyaltyTierIconKey } from "@/features/admin-loyalty-tiers/types";

const icons = {
  sparkles: Sparkles,
  "shield-check": ShieldCheck,
  trophy: Trophy,
  gem: Gem,
} satisfies Record<LoyaltyTierIconKey, React.ComponentType<LucideProps>>;

export function LoyaltyTierIcon({
  iconKey,
  ...props
}: LucideProps & { iconKey: LoyaltyTierIconKey | null }) {
  const Icon = iconKey ? icons[iconKey] : Sparkles;
  return <Icon {...props} />;
}
