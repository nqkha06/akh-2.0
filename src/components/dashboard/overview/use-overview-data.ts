"use client";

import { useEffect, useRef, useState } from "react";

import { getOverviewMockData } from "./overview.mock";
import type { OverviewData, OverviewDateRange } from "./types";

type OverviewDataState = {
  data?: OverviewData;
  isLoading: boolean;
  error?: string;
};

export function useOverviewData() {
  const [dateRange, setDateRange] = useState<OverviewDateRange>("30d");
  const [customRange, setCustomRange] = useState({ from: "2026-06-01", to: "2026-06-30" });
  const [state, setState] = useState<OverviewDataState>(() => ({
    data: process.env.NODE_ENV === "development" ? getOverviewMockData("30d") : undefined,
    isLoading: false,
  }));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const loadRange = (nextRange: OverviewDateRange) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDateRange(nextRange);
    setState((current) => ({ ...current, isLoading: true, error: undefined }));

    timerRef.current = setTimeout(() => {
      setState({
        data: process.env.NODE_ENV === "development" ? getOverviewMockData(nextRange) : undefined,
        isLoading: false,
      });
    }, 360);
  };

  const refresh = () => loadRange(dateRange);

  const applyCustomRange = (from: string, to: string) => {
    setCustomRange({ from, to });
    loadRange("custom");
  };

  return {
    ...state,
    dateRange,
    customRange,
    setDateRange: loadRange,
    applyCustomRange,
    refresh,
    retry: refresh,
  };
}
