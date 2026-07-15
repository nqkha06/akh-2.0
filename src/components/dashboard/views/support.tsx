"use client";

import { useEffect } from "react";

import { ReportAbuseDialog } from "@/components/dashboard/support/report-abuse-dialog";
import { ContactSupportPanel, RecommendedArticles, SupportFAQ, SupportTopics } from "@/components/dashboard/support/support-content";
import { SupportErrorState, SupportSearch, SupportSkeleton, SystemStatusStrip } from "@/components/dashboard/support/support-overview";
import { CreateSupportRequestSheet } from "@/components/dashboard/support/support-request-sheet";
import { RecentSupportRequests, SupportRequestDetail } from "@/components/dashboard/support/support-requests";
import { useSupportController } from "@/components/dashboard/support/use-support-controller";
import { PageHeader } from "@/components/dashboard/ui";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupportView() {
  const controller = useSupportController();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("#support-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  if (controller.loading) return <SupportSkeleton />;
  if (controller.error || !controller.data) return <SupportErrorState onRetry={() => void controller.retry()} />;

  const openCreateRequest = () => controller.setRequestSheetOpen(true);
  const scrollToRequests = () => document.querySelector("#recent-support-requests")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <div className="mx-auto w-full max-w-[1280px] space-y-6"><PageHeader title="Hỗ trợ" description="Tìm hướng dẫn hoặc gửi yêu cầu để nhận trợ giúp từ Rekonise." action={<Button className="h-10 w-full sm:w-auto" onClick={openCreateRequest}><MessageSquarePlus />Gửi yêu cầu</Button>} /><SupportSearch controller={controller} /><SystemStatusStrip status={controller.data.systemStatus} /><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]"><main className="min-w-0 space-y-8"><SupportTopics topics={controller.data.topics} /><RecommendedArticles articles={controller.data.articles} /></main><ContactSupportPanel contact={controller.data.contact} onCreate={openCreateRequest} onViewRequests={scrollToRequests} onReportAbuse={() => controller.setAbuseOpen(true)} /></div><RecentSupportRequests items={controller.data.requests} onOpen={controller.setDetailRequest} /><SupportFAQ /><CreateSupportRequestSheet controller={controller} /><SupportRequestDetail controller={controller} /><ReportAbuseDialog controller={controller} /></div>;
}
