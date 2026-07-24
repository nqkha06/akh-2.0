"use client";

import { useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";

import {
  SupportErrorState,
  SupportSkeleton,
  SupportTicketSummary,
} from "@/components/dashboard/support/support-overview";
import { CreateSupportRequestSheet } from "@/components/dashboard/support/support-request-sheet";
import {
  SupportRequestDetail,
  SupportTicketList,
} from "@/components/dashboard/support/support-requests";
import { useSupportController } from "@/components/dashboard/support/use-support-controller";
import { PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

export function SupportView() {
  const controller = useSupportController();
  const brand = useSiteBrand();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>("#support-ticket-search")
          ?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  if (controller.loading) return <SupportSkeleton />;
  if (controller.error || !controller.data) {
    return <SupportErrorState onRetry={() => void controller.retry()} />;
  }

  const openCreateRequest = () => controller.setRequestSheetOpen(true);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <PageHeader
        title="Hỗ trợ"
        description={`Tạo và theo dõi ticket hỗ trợ với đội ngũ ${brand.siteName}.`}
        action={
          <Button
            className="h-10 w-full sm:w-auto"
            onClick={openCreateRequest}
          >
            <MessageSquarePlus />
            Tạo ticket
          </Button>
        }
      />

      <SupportTicketSummary items={controller.data.requests} />
      <SupportTicketList
        controller={controller}
        onCreate={openCreateRequest}
      />

      <CreateSupportRequestSheet controller={controller} />
      <SupportRequestDetail controller={controller} />
    </div>
  );
}
