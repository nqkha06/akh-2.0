"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getSupportDemoData, supportDataSource } from "./demo-data-source";
import type { CreateSupportRequestInput, SupportRequest } from "./types";

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function useSupportController() {
  const [initialData] = useState(() => process.env.NODE_ENV === "development" ? getSupportDemoData() : undefined);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<SupportRequest>();
  const [successRequest, setSuccessRequest] = useState<SupportRequest>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [abuseOpen, setAbuseOpen] = useState(false);

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
    if (!initialData) void Promise.resolve().then(load);
  }, [initialData, load]);

  const searchResults = useMemo(() => {
    if (!data || !query.trim()) return [];
    const normalized = query.trim().toLocaleLowerCase("vi");
    return data.articles.filter((article) => `${article.title} ${article.summary} ${article.category}`.toLocaleLowerCase("vi").includes(normalized));
  }, [data, query]);

  const createRequest = async (input: CreateSupportRequestInput) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setSubmitError("");
      const request = await supportDataSource.createRequest(input);
      setData((current) => current ? { ...current, requests: [request, ...current.requests] } : current);
      setSuccessRequest(request);
      toast.success("Yêu cầu hỗ trợ đã được gửi.");
    } catch (submitFailure) {
      setSubmitError(submitFailure instanceof Error ? submitFailure.message : "Không thể gửi yêu cầu hỗ trợ.");
    } finally {
      setSubmitting(false);
    }
  };

  const reply = async (id: string, content: string) => {
    const message = await supportDataSource.replyToRequest(id, content);
    setData((current) => current ? { ...current, requests: current.requests.map((request) => request.id === id ? { ...request, status: "in_progress", updatedAt: message.createdAt, messages: [...request.messages, message] } : request) } : current);
    setDetailRequest((current) => current?.id === id ? { ...current, status: "in_progress", updatedAt: message.createdAt, messages: [...current.messages, message] } : current);
    toast.success("Phản hồi đã được gửi.");
  };

  return {
    data, loading, error, query, searchResults, requestSheetOpen, detailRequest, successRequest, submitting, submitError, abuseOpen,
    retry: load, setQuery, setRequestSheetOpen, setDetailRequest, setSuccessRequest, setAbuseOpen, createRequest, reply,
  };
}

export type SupportController = ReturnType<typeof useSupportController>;
