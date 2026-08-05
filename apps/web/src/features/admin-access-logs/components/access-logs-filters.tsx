"use client";

import { Filter, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AccessLogsTableQuery } from "../query/access-logs-search-params";

type Filters = Record<string, string>;

export function AccessLogsFilters({ query }: { query: AccessLogsTableQuery }) {
  const router = useRouter();
  const [filters, setFilters] = React.useState<Filters>(() => ({
    from: toLocalInput(query.from),
    to: toLocalInput(query.to),
    userId: query.userId ? String(query.userId) : "",
    user: query.user,
    linkId: query.linkId ? String(query.linkId) : "",
    link: query.link,
    ip: query.ip,
    country: query.country,
    device: query.device ? String(query.device) : "all",
    isEarn: query.isEarn === null ? "all" : String(query.isEarn),
    hasRevenue:
      query.hasRevenue === null ? "all" : String(query.hasRevenue),
    detectionMask:
      query.detectionMask === null ? "" : String(query.detectionMask),
    rejectReasonMask:
      query.rejectReasonMask === null ? "" : String(query.rejectReasonMask),
    state: query.state || "all",
    reviewStatus: query.reviewStatus || "all",
  }));

  function set(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function apply() {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("perPage", String(query.perPage));
    params.set("sortBy", query.sortBy);
    params.set("sortOrder", query.sortOrder);
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value === "all") continue;
      if (key === "from" || key === "to") {
        params.set(key, new Date(value).toISOString());
      } else {
        params.set(key, value);
      }
    }
    router.push(`/admin/stu-access-logs?${params.toString()}`);
  }

  function setPeriod(hours: number) {
    const to = new Date();
    const from = new Date(to.getTime() - hours * 60 * 60 * 1_000);
    setFilters((current) => ({
      ...current,
      from: toLocalInput(from.toISOString()),
      to: toLocalInput(to.toISOString()),
    }));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" /> Bộ lọc điều tra
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Tất cả điều kiện được xử lý phía server. Mặc định tải 24 giờ gần nhất.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPeriod(24)}>
            24 giờ
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod(168)}>
            7 ngày
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod(720)}>
            30 ngày
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput label="Từ thời điểm" type="datetime-local" value={filters.from} onChange={(value) => set("from", value)} />
          <FilterInput label="Đến thời điểm" type="datetime-local" value={filters.to} onChange={(value) => set("to", value)} />
          <FilterInput label="User ID" type="number" value={filters.userId} onChange={(value) => set("userId", value)} placeholder="123" />
          <FilterInput label="Email hoặc tên user" value={filters.user} onChange={(value) => set("user", value)} placeholder="user@example.com" />
          <FilterInput label="Link ID" type="number" value={filters.linkId} onChange={(value) => set("linkId", value)} placeholder="456" />
          <FilterInput label="Alias hoặc tiêu đề link" value={filters.link} onChange={(value) => set("link", value)} placeholder="summer-campaign" />
          <FilterInput label="IP address" value={filters.ip} onChange={(value) => set("ip", value)} placeholder="113.161..." />
          <FilterInput label="Quốc gia" value={filters.country} onChange={(value) => set("country", value.toUpperCase())} placeholder="VN" />
          <FilterSelect label="Thiết bị" value={filters.device} onChange={(value) => set("device", value)} options={[['all','Tất cả'],['1','Mobile'],['2','Desktop'],['3','Tablet']]} />
          <FilterSelect label="is_earn" value={filters.isEarn} onChange={(value) => set("isEarn", value)} options={[['all','Tất cả'],['true','Có'],['false','Không']]} />
          <FilterSelect label="Revenue" value={filters.hasRevenue} onChange={(value) => set("hasRevenue", value)} options={[['all','Tất cả'],['true','Có revenue'],['false','Không revenue']]} />
          <FilterSelect label="Detection status" value={filters.state} onChange={(value) => set("state", value)} options={[['all','Tất cả'],['normal','Bình thường'],['rejected','Bị từ chối'],['suspicious','Đáng ngờ']]} />
          <FilterInput label="Detection mask" type="number" value={filters.detectionMask} onChange={(value) => set("detectionMask", value)} placeholder="0" />
          <FilterInput label="Reject reason mask" type="number" value={filters.rejectReasonMask} onChange={(value) => set("rejectReasonMask", value)} placeholder="1" />
          <FilterSelect label="Review" value={filters.reviewStatus} onChange={(value) => set("reviewStatus", value)} options={[['all','Tất cả'],['unreviewed','Chưa review'],['safe','An toàn'],['suspicious','Đáng ngờ'],['follow_up','Theo dõi thêm']]} />
          <FilterSelect label="Sắp xếp" value={`${query.sortBy}:${query.sortOrder}`} onChange={(value) => { const [sortBy, sortOrder] = value.split(':'); const params = new URLSearchParams(window.location.search); params.set('sortBy', sortBy); params.set('sortOrder', sortOrder); params.set('page','1'); router.push(`/admin/stu-access-logs?${params.toString()}`); }} options={[['createdAt:desc','Mới nhất'],['createdAt:asc','Cũ nhất'],['revenue:desc','Revenue cao nhất']]} />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => router.push("/admin/stu-access-logs")}>
            <RotateCcw /> Xóa bộ lọc
          </Button>
          <Button onClick={apply}>
            <Filter /> Áp dụng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterInput({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const id = React.useId();
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string,string]> }) {
  const id = React.useId();
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{options.map(([key,text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select></div>;
}

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
