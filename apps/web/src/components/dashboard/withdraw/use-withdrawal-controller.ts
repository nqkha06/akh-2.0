"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";

import { withdrawalDataSource } from "./api-data-source";
import type {
  CreateWithdrawalPayload,
  PayoutMethod,
  WithdrawalDashboardData,
  WithdrawalEstimate,
  WithdrawalStatus,
  WithdrawalTransaction,
} from "./types";

function parseAmount(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatAmountInput(value: number) {
  return value > 0 ? new Intl.NumberFormat("vi-VN").format(value) : "";
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function useWithdrawalController() {
  const {
    baseCurrency,
    formatCurrency: formatMemberCurrency,
  } = useMemberCurrency();
  const [data, setData] = useState<WithdrawalDashboardData>();
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [historyError] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [estimate, setEstimate] = useState<WithdrawalEstimate>();
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<WithdrawalTransaction>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [detailTransaction, setDetailTransaction] = useState<WithdrawalTransaction>();
  const [cancelling, setCancelling] = useState(false);
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "30d" | "90d">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [historyAnchor] = useState(() => Date.now());
  const estimateRequestRef = useRef(0);
  const idempotencyKeyRef = useRef("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await withdrawalDataSource.getDashboard();
      setData(response);
      setSelectedMethodId(response.defaultMethodId ?? response.payoutMethods[0]?.id ?? "");
      setPageError("");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const amount = parseAmount(amountInput);
  const selectedMethod = data?.payoutMethods.find((method) => method.id === selectedMethodId);
  const formatCurrency = useCallback(
    (value: number) =>
      formatMemberCurrency(value, {
        sourceCurrency: data?.currency ?? baseCurrency,
      }),
    [baseCurrency, data?.currency, formatMemberCurrency],
  );

  const validationError = useMemo(() => {
    if (!data || !amountInput) return "";
    if (!Number.isFinite(amount) || amount <= 0) return "Vui lòng nhập số tiền hợp lệ.";
    const minimum = selectedMethod?.minimumAmount ?? data.limits.minimum;
    if (amount < minimum) return `Số tiền tối thiểu là ${formatCurrency(minimum)}.`;
    const transactionMaximum = Math.min(data.limits.maximum, data.limits.remaining ?? Number.POSITIVE_INFINITY);
    if (amount > transactionMaximum) return `Số tiền vượt quá hạn mức hiện tại ${formatCurrency(transactionMaximum)}.`;
    if (amount > data.availableBalance) return "Số tiền vượt quá số dư khả dụng.";
    return "";
  }, [amount, amountInput, data, formatCurrency, selectedMethod]);

  useEffect(() => {
    const requestId = ++estimateRequestRef.current;
    if (!amount || validationError || !selectedMethodId) {
      return;
    }
    const timer = setTimeout(async () => {
      setEstimateLoading(true);
      try {
        const response = await withdrawalDataSource.estimate({ amount, payoutMethodId: selectedMethodId });
        if (requestId === estimateRequestRef.current) setEstimate(response);
      } finally {
        if (requestId === estimateRequestRef.current) setEstimateLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [amount, selectedMethodId, validationError]);

  const formEligible = Boolean(data?.eligibility.eligible && selectedMethod);
  const formValid = Boolean(formEligible && amount > 0 && !validationError && estimate && !estimateLoading);

  const setAmount = (value: string) => {
    if (submitting) return;
    const nextAmount = parseAmount(value);
    setAmountInput(formatAmountInput(nextAmount));
    setEstimate(undefined);
    setEstimateLoading(false);
    setSubmitError("");
  };

  const setMaximumAmount = () => {
    if (!data || submitting) return;
    const maximum = Math.min(
      data.availableBalance,
      data.limits.maximum,
      data.limits.remaining ?? Number.POSITIVE_INFINITY,
    );
    setAmountInput(formatAmountInput(maximum));
    setEstimate(undefined);
    setEstimateLoading(false);
    setSubmitError("");
  };

  const selectMethod = (methodId: string) => {
    if (submitting) return;
    setSelectedMethodId(methodId);
    setEstimate(undefined);
    setEstimateLoading(false);
    setSubmitError("");
  };

  const requestConfirmation = () => {
    if (!formValid) return;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    setSubmitError("");
    setConfirmationOpen(true);
  };

  const confirmWithdrawal = async () => {
    if (!data || !formValid || submitting) return;
    const payload: CreateWithdrawalPayload = {
      amount,
      payoutMethodId: selectedMethodId,
      idempotencyKey: idempotencyKeyRef.current,
    };
    try {
      setSubmitting(true);
      setSubmitError("");
      const transaction = await withdrawalDataSource.create(payload);
      setData((current) => current ? {
        ...current,
        availableBalance: current.availableBalance - transaction.requestedAmount,
        pendingBalance: current.pendingBalance + transaction.requestedAmount,
        transactions: [transaction, ...current.transactions],
      } : current);
      setConfirmationOpen(false);
      setSuccessTransaction(transaction);
      setAmountInput("");
      setEstimate(undefined);
      idempotencyKeyRef.current = "";
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo yêu cầu rút tiền.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelWithdrawal = async (transaction: WithdrawalTransaction) => {
    if (!data || !transaction.canCancel || cancelling) return;
    try {
      setCancelling(true);
      const cancelled = await withdrawalDataSource.cancel(transaction.id);
      setData((current) =>
        current
          ? {
              ...current,
              availableBalance:
                current.availableBalance + transaction.requestedAmount,
              pendingBalance: Math.max(
                0,
                current.pendingBalance - transaction.requestedAmount,
              ),
              transactions: current.transactions.map((item) =>
                item.id === cancelled.id ? cancelled : item,
              ),
            }
          : current,
      );
      setDetailTransaction(cancelled);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Không thể hủy yêu cầu.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    const cutoff = dateFilter === "30d" ? historyAnchor - 30 * 86_400_000 : dateFilter === "90d" ? historyAnchor - 90 * 86_400_000 : 0;
    return data.transactions
      .filter((transaction) => statusFilter === "all" || transaction.status === statusFilter)
      .filter((transaction) => !cutoff || new Date(transaction.createdAt).getTime() >= cutoff)
      .sort((a, b) => sort === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data, dateFilter, historyAnchor, sort, statusFilter]);

  return {
    data,
    loading,
    pageError,
    historyError,
    amountInput,
    amount,
    selectedMethod,
    selectedMethodId,
    estimate,
    estimateLoading,
    validationError,
    formEligible,
    formValid,
    confirmationOpen,
    successTransaction,
    submitting,
    submitError,
    detailTransaction,
    cancelling,
    filteredTransactions,
    statusFilter,
    dateFilter,
    sort,
    formatCurrency,
    retry: load,
    setAmount,
    setMaximumAmount,
    setSelectedMethodId: selectMethod,
    requestConfirmation,
    setConfirmationOpen,
    confirmWithdrawal,
    setSuccessTransaction,
    setDetailTransaction,
    cancelWithdrawal,
    setStatusFilter,
    setDateFilter,
    setSort,
  };
}

export type WithdrawalController = ReturnType<typeof useWithdrawalController>;
export type { PayoutMethod };
