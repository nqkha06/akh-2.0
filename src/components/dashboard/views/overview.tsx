"use client";

import { ConversionFunnel } from "@/components/dashboard/overview/conversion-funnel";
import { OverviewDateControls } from "@/components/dashboard/overview/overview-header";
import { OverviewMetrics } from "@/components/dashboard/overview/overview-metrics";
import { OverviewEmptyState, OverviewErrorState, OverviewSkeleton } from "@/components/dashboard/overview/overview-states";
import { PerformanceChart } from "@/components/dashboard/overview/performance-chart";
import { QuickActions } from "@/components/dashboard/overview/quick-actions";
import { RecentActivity } from "@/components/dashboard/overview/recent-activity";
import { TopContentTable } from "@/components/dashboard/overview/top-content-table";
import { useOverviewData } from "@/components/dashboard/overview/use-overview-data";
import { PageHeader } from "../ui";

export function OverviewView() {
  const {
    data,
    dateRange,
    customRange,
    isLoading,
    error,
    setDateRange,
    applyCustomRange,
    refresh,
    retry,
  } = useOverviewData();

  return (
    <div className="mx-auto max-w-[1280px] space-y-7 [--primary:oklch(0.55_0.21_274)] [--ring:var(--primary)] [--overview-success:oklch(0.53_0.15_154)] dark:[--primary:oklch(0.7_0.16_274)] dark:[--overview-success:oklch(0.72_0.16_154)] sm:space-y-8">
      
      
      <PageHeader
        title="Bảng tổng quan"
        description="Theo dõi lượt truy cập, chuyển đổi và hiệu suất nội dung của bạn."
        action={
          <OverviewDateControls
            dateRange={dateRange}
            customRange={customRange}
            isRefreshing={isLoading}
            onDateRangeChange={setDateRange}
            onCustomRangeApply={applyCustomRange}
            onRefresh={refresh}
          />
        }
      />

      {error ? <OverviewErrorState onRetry={retry} /> : null}

      {isLoading ? (
        <OverviewSkeleton />
      ) : !data || data.topContent.length === 0 ? (
        <OverviewEmptyState />
      ) : (
        <div className="space-y-7 sm:space-y-8">
          <OverviewMetrics metrics={data.metrics} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)]">
            <PerformanceChart data={data.performance} summary={data.performanceSummary} />
            <ConversionFunnel steps={data.funnel} />
          </div>

          <TopContentTable items={data.topContent} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
            <RecentActivity items={data.recentActivity} />
            <QuickActions actions={data.quickActions} />
          </div>
        </div>
      )}
    </div>
  );
}
