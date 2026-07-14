import { AlertCircle, Building2, Clock3, CreditCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  AppButton,
  Badge,
  PageHeader,
  SoftCard,
  StatCard,
  TableShell,
} from "@/components/dashboard/ui";

export function WithdrawView() {
  const t = useTranslations("SimplePages.withdraw");

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

    </>
  );
}
