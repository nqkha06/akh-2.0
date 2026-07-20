"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getRewardsDemoData, rewardsDataSource } from "./demo-data-source";
import type { RewardHistoryItem, RewardsDashboardData } from "./types";

export function formatRewardAmount(amount: number, currency = "USD") {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
}

export function formatRewardDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function useRewardsController() {
  const [initialData] = useState<RewardsDashboardData | undefined>(() => process.env.NODE_ENV === "development" ? getRewardsDemoData() : undefined);
  const [data, setData] = useState<RewardsDashboardData | undefined>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<RewardHistoryItem>();
  const [claimingId, setClaimingId] = useState<string>();
  const [claimError, setClaimError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await rewardsDataSource.getDashboard());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) return;
    void Promise.resolve().then(load);
  }, [initialData, load]);

  const claimMission = async (id: string) => {
    if (claimingId) return;
    try {
      setClaimingId(id);
      setClaimError("");
      const result = await rewardsDataSource.claimMission(id);
      setData((current) => current ? {
        ...current,
        summary: {
          ...current.summary,
          availableRewardBalance: {
            ...current.summary.availableRewardBalance,
            amount: current.summary.availableRewardBalance.amount + result.mission.reward.amount,
          },
        },
        missions: current.missions.map((mission) => mission.id === id ? result.mission : mission),
        history: [result.historyItem, ...current.history],
      } : current);
      toast.success("Phần thưởng đã được cộng vào ví.");
    } catch (claimFailure) {
      setClaimError(claimFailure instanceof Error ? claimFailure.message : "Không thể nhận phần thưởng.");
    } finally {
      setClaimingId(undefined);
    }
  };

  return {
    data, loading, error, rulesOpen, detailItem, claimingId, claimError,
    retry: load, setRulesOpen, setDetailItem, claimMission,
  };
}

export type RewardsController = ReturnType<typeof useRewardsController>;
