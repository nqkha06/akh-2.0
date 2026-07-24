"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { supportDataSource } from "./support-data-source";
import type {
  CreateSupportRequestInput,
  SupportDashboardData,
  SupportRequest,
} from "./types";

export type SupportTicketFilter = "all" | "active" | "waiting_user" | "resolved";

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function useSupportController() {
  const [data, setData] = useState<SupportDashboardData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<SupportRequest>();
  const [successRequest, setSuccessRequest] = useState<SupportRequest>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportTicketFilter>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await supportDataSource.getDashboard());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const filteredRequests = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLocaleLowerCase("vi");
    return data.requests.filter((request) => {
      const matchesQuery =
        !normalized ||
        `${request.reference} ${request.subject} ${request.category}`
          .toLocaleLowerCase("vi")
          .includes(normalized);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          ["submitted", "in_progress", "answered"].includes(request.status)) ||
        (statusFilter === "waiting_user" &&
          request.status === "waiting_user") ||
        (statusFilter === "resolved" &&
          ["resolved", "closed"].includes(request.status));
      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  const createRequest = async (input: CreateSupportRequestInput) => {
    if (submitting) return false;
    try {
      setSubmitting(true);
      setSubmitError("");
      const request = await supportDataSource.createRequest(input);
      setData((current) => current ? { ...current, requests: [request, ...current.requests] } : current);
      setQuery("");
      setStatusFilter("all");
      setSuccessRequest(request);
      toast.success("Ticket hỗ trợ đã được tạo.");
      return true;
    } catch (submitFailure) {
      setSubmitError(submitFailure instanceof Error ? submitFailure.message : "Không thể gửi yêu cầu hỗ trợ.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const reply = async (id: number, content: string) => {
    const ticket = await supportDataSource.replyToRequest(id, content);
    setData((current) => current ? { ...current, requests: current.requests.map((request) => request.id === id ? ticket : request) } : current);
    setDetailRequest(ticket);
    toast.success("Phản hồi đã được gửi.");
  };

  const openRequest = async (request: SupportRequest) => {
    setDetailRequest(request);
    try {
      const fresh = await supportDataSource.getRequest(request.id);
      setDetailRequest((current) => current?.id === fresh.id ? fresh : current);
      setData((current) => current ? {
        ...current,
        requests: current.requests.map((item) => item.id === fresh.id ? fresh : item),
      } : current);
    } catch {
      toast.error("Không thể làm mới nội dung ticket.");
    }
  };

  return {
    data, loading, error, query, statusFilter, filteredRequests,
    requestSheetOpen, detailRequest, successRequest, submitting, submitError,
    hasFilters: Boolean(query.trim()) || statusFilter !== "all",
    retry: load, setQuery, setStatusFilter, clearFilters, setRequestSheetOpen,
    setDetailRequest, openRequest, setSuccessRequest, createRequest, reply,
  };
}

export type SupportController = ReturnType<typeof useSupportController>;
