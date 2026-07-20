"use client";

import { useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { OverviewDateRange } from "./types";

type OverviewHeaderProps = {
  dateRange: OverviewDateRange;
  customRange: { from: string; to: string };
  isRefreshing?: boolean;
  onDateRangeChange: (range: OverviewDateRange) => void;
  onCustomRangeApply: (from: string, to: string) => void;
  onRefresh: () => void;
};

export function OverviewDateControls({
  dateRange,
  customRange,
  isRefreshing,
  onDateRangeChange,
  onCustomRangeApply,
  onRefresh,
}: OverviewHeaderProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(customRange);

  const handleRangeChange = (value: string) => {
    const nextRange = value as OverviewDateRange;
    if (nextRange === "custom") {
      setCustomOpen(true);
      return;
    }
    onDateRangeChange(nextRange);
  };

  const applyCustomRange = () => {
    onCustomRangeApply(draftRange.from, draftRange.to);
    setCustomOpen(false);
  };

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverAnchor asChild>
            <div className="min-w-36 flex-1 sm:flex-none">
              <Select value={dateRange} onValueChange={handleRangeChange}>
                <SelectTrigger className="h-11 w-full bg-background shadow-none" aria-label="Chọn khoảng thời gian">
                  <CalendarDays aria-hidden="true" />
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="7d">7 ngày</SelectItem>
                  <SelectItem value="30d">30 ngày</SelectItem>
                  <SelectItem value="90d">90 ngày</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverAnchor>
          <PopoverContent align="end" className="w-80 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Khoảng thời gian tùy chỉnh</p>
              <p className="mt-1 text-xs text-muted-foreground">Chọn ngày bắt đầu và kết thúc báo cáo.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                Từ ngày
                <input
                  type="date"
                  value={draftRange.from}
                  max={draftRange.to}
                  onChange={(event) => setDraftRange((current) => ({ ...current, from: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                Đến ngày
                <input
                  type="date"
                  value={draftRange.to}
                  min={draftRange.from}
                  onChange={(event) => setDraftRange((current) => ({ ...current, to: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            </div>
            <Button className="mt-4 w-full" onClick={applyCustomRange} disabled={!draftRange.from || !draftRange.to}>
              Áp dụng khoảng ngày
            </Button>
          </PopoverContent>
        </Popover>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                // size="lg"
                className="shrink-0 bg-background shadow-none"
                aria-label="Làm mới dữ liệu tổng quan"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={isRefreshing ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Làm mới dữ liệu</TooltipContent>
          </Tooltip>
        </TooltipProvider>
    </div>
  );
}
