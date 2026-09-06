"use client";

import {
  AlertTriangle,
  Bug,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock3,
  Eye,
  Filter,
  Info,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  bulkDeleteSystemLogs,
  cleanupSystemLogs,
  createSystemLogCategory,
  deleteSystemLog,
  getSystemLog,
  updateSystemLogCategory,
  updateSystemLogSettings,
} from "../api/system-logs.client";
import type { SystemLogsQuery } from "../query/system-logs-search-params";
import type { SystemLog, SystemLogDetail, SystemLogSettings, SystemLogsResponse, SystemLogStats } from "../types";

type Props = {
  result: SystemLogsResponse;
  stats: SystemLogStats;
  settings: SystemLogSettings;
  query: SystemLogsQuery;
  canDelete: boolean;
  canManageSettings: boolean;
};

export function SystemLogsDashboard(props: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);
  const [cleanupOpen, setCleanupOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const allSelected = props.result.items.length > 0 && props.result.items.every((log) => selectedIds.includes(log.id));

  async function confirmDelete() {
    setBusy(true);
    try {
      const result = deleteIds.length === 1
        ? await deleteSystemLog(deleteIds[0])
        : await bulkDeleteSystemLogs(deleteIds);
      toast.success(`Đã xóa ${result.deletedCount} log.`);
      setSelectedIds([]);
      setDeleteIds([]);
      router.refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-5">
    <StatsGrid stats={props.stats} />
    <Filters query={props.query} categories={props.settings.categories.filter((item) => item.isActive).map((item) => item.key)} />
    <Card className="overflow-hidden rounded-xl border-border/60 shadow-none">
      <CardContent className="p-0">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-medium">{number(props.result.total)} nhật ký</p>
            <p className="text-xs text-muted-foreground">Sắp xếp theo thời gian mới nhất</p>
          </div>
          <div className="flex items-center gap-2">
            {props.canDelete && selectedIds.length ? <Button size="sm" variant="destructive" onClick={() => setDeleteIds(selectedIds)}><Trash2 /> Xóa {selectedIds.length}</Button> : null}
            {props.canDelete ? <Button size="sm" variant="outline" onClick={() => setCleanupOpen(true)}><Clock3 /> Cleanup</Button> : null}
            {props.canManageSettings ? <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}><Settings2 /> Retention</Button> : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
              {props.canDelete ? <TableHead className="w-10"><Checkbox checked={allSelected} aria-label="Chọn tất cả log trên trang" onCheckedChange={(checked) => setSelectedIds(checked ? props.result.items.map((item) => item.id) : [])} /></TableHead> : null}
              <TableHead className="min-w-36">Thời gian</TableHead><TableHead>Level</TableHead><TableHead>Category</TableHead><TableHead className="min-w-40">Module / Context</TableHead><TableHead className="min-w-40">Event</TableHead><TableHead className="min-w-72">Message</TableHead><TableHead className="min-w-48">User / Admin</TableHead><TableHead className="min-w-32">IP</TableHead><TableHead className="w-20" />
            </TableRow></TableHeader>
            <TableBody>
              {props.result.items.length ? props.result.items.map((log) => <TableRow key={log.id} className="cursor-pointer" onClick={() => setDetailId(log.id)}>
                {props.canDelete ? <TableCell onClick={(event) => event.stopPropagation()}><Checkbox checked={selectedIds.includes(log.id)} aria-label={`Chọn log ${log.id}`} onCheckedChange={(checked) => setSelectedIds((current) => checked ? [...new Set([...current, log.id])] : current.filter((id) => id !== log.id))} /></TableCell> : null}
                <TableCell><p className="whitespace-nowrap text-sm font-medium">{date(log.createdAt)}</p><p className="text-xs text-muted-foreground">{time(log.createdAt)}</p></TableCell>
                <TableCell><LevelBadge level={log.level} /></TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[11px]">{log.category}</Badge></TableCell>
                <TableCell className="text-sm">{log.context || "—"}</TableCell>
                <TableCell><code className="text-xs">{log.event || "—"}</code></TableCell>
                <TableCell><p className="line-clamp-2 max-w-lg text-sm">{log.message}</p></TableCell>
                <TableCell><Actor log={log} /></TableCell>
                <TableCell><code className="text-xs">{log.ipAddress || "—"}</code></TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}><div className="flex">
                  <Button variant="ghost" size="icon-sm" aria-label="Xem chi tiết" onClick={() => setDetailId(log.id)}><Eye /></Button>
                  {props.canDelete ? <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Xóa log" onClick={() => setDeleteIds([log.id])}><Trash2 /></Button> : null}
                </div></TableCell>
              </TableRow>) : <TableRow><TableCell colSpan={props.canDelete ? 10 : 9} className="h-36 text-center text-muted-foreground">Không có system log phù hợp bộ lọc.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <Pagination result={props.result} query={props.query} />
      </CardContent>
    </Card>
    {detailId ? <LogDetailSheet key={detailId} id={detailId} onClose={() => setDetailId(null)} /> : null}
    {props.canDelete ? <CleanupDialog open={cleanupOpen} onOpenChange={setCleanupOpen} onDone={() => router.refresh()} /> : null}
    {props.canManageSettings && settingsOpen ? <SettingsDialog open onOpenChange={setSettingsOpen} initial={props.settings} onDone={() => router.refresh()} /> : null}
    <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa {deleteIds.length} system log?</AlertDialogTitle><AlertDialogDescription>Thao tác này không thể hoàn tác. Các log đã chọn sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{busy ? "Đang xóa…" : `Xóa ${deleteIds.length} log`}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}

function StatsGrid({ stats }: { stats: SystemLogStats }) {
  const cards = [
    ["Total logs 24h", stats.total, Info],
    ["Errors 24h", stats.errors, Bug],
    ["Warnings 24h", stats.warnings, AlertTriangle],
    ["Security events", stats.security, ShieldAlert],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <Card key={label} className="rounded-xl border-border/60 shadow-none"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{number(value)}</p></div><div className="flex size-9 items-center justify-center rounded-lg border bg-muted/30"><Icon className="size-4 text-muted-foreground" /></div></CardContent></Card>)}</div>;
}

function Filters({ query, categories }: { query: SystemLogsQuery; categories: string[] }) {
  const router = useRouter();
  const [filters, setFilters] = React.useState({ keyword: query.keyword, level: query.level || "all", category: query.category || "all", context: query.context, event: query.event, user: query.user, from: localDate(query.from), to: localDate(query.to) });
  const set = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  function apply() {
    const params = new URLSearchParams({ page: "1", perPage: String(query.perPage) });
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === "all") return;
      params.set(key, key === "from" || key === "to" ? new Date(value).toISOString() : value);
    });
    router.push(`/admin/system-logs?${params}`);
  }
  return <Card className="rounded-xl border-border/60 shadow-none"><CardContent className="space-y-4 p-4">
    <div className="grid gap-3 lg:grid-cols-[minmax(220px,2fr)_repeat(3,minmax(140px,1fr))_auto]">
      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={filters.keyword} onChange={(e) => set("keyword", e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()} placeholder="Tìm message, request ID…" className="pl-9" /></div>
      <Select value={filters.level} onValueChange={(value) => set("level", value)}><SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả level</SelectItem>{["info", "warn", "error", "debug"].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select>
      <Select value={filters.category} onValueChange={(value) => set("category", value)}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả category</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select>
      <Input value={filters.user} onChange={(e) => set("user", e.target.value)} placeholder="User / Admin" />
      <Button onClick={apply}><Filter /> Lọc</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input value={filters.context} onChange={(e) => set("context", e.target.value)} placeholder="Module / Context" />
      <Input value={filters.event} onChange={(e) => set("event", e.target.value)} placeholder="Event" />
      <Input type="datetime-local" value={filters.from} onChange={(e) => set("from", e.target.value)} aria-label="Từ thời gian" />
      <Input type="datetime-local" value={filters.to} onChange={(e) => set("to", e.target.value)} aria-label="Đến thời gian" />
      <Button variant="ghost" onClick={() => router.push("/admin/system-logs")}><RotateCcw /> Reset filter</Button>
    </div>
  </CardContent></Card>;
}

function Pagination({ result, query }: { result: SystemLogsResponse; query: SystemLogsQuery }) {
  const router = useRouter();
  const go = (page: number) => { const params = new URLSearchParams(window.location.search); params.set("page", String(page)); router.push(`/admin/system-logs?${params}`); };
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"><p className="text-xs text-muted-foreground">Trang {result.page}/{result.pageCount} · {number(result.total)} kết quả</p><div className="flex items-center gap-2"><Select value={String(query.perPage)} onValueChange={(value) => { const params = new URLSearchParams(window.location.search); params.set("perPage", value); params.set("page", "1"); router.push(`/admin/system-logs?${params}`); }}><SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger><SelectContent>{[20, 50, 100].map((value) => <SelectItem key={value} value={String(value)}>{value}/trang</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon-sm" disabled={result.page <= 1} onClick={() => go(result.page - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" disabled={result.page >= result.pageCount} onClick={() => go(result.page + 1)}><ChevronRight /></Button></div></div>;
}

function LogDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const [log, setLog] = React.useState<SystemLogDetail | null>(null);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let live = true;
    getSystemLog(id).then((value) => live && setLog(value)).catch((reason) => live && setError(message(reason)));
    return () => { live = false; };
  }, [id]);
  return <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full p-0 sm:max-w-2xl"><SheetHeader className="border-b px-6 py-5"><SheetTitle>Chi tiết system log</SheetTitle><SheetDescription>{id || ""}</SheetDescription></SheetHeader><ScrollArea className="h-[calc(100vh-96px)]"><div className="space-y-6 p-6">{error ? <p className="text-sm text-destructive">{error}</p> : !log ? <p className="text-sm text-muted-foreground">Đang tải chi tiết…</p> : <>
    <div className="grid gap-4 sm:grid-cols-2"><Detail label="Timestamp" value={`${date(log.createdAt)} ${time(log.createdAt)}`} /><Detail label="Level" value={<LevelBadge level={log.level} />} /><Detail label="Category" value={log.category} /><Detail label="Context" value={log.context || "—"} /><Detail label="Event" value={log.event || "—"} /><Detail label="Request / Trace ID" value={log.requestId || "—"} mono /><Detail label="User ID" value={log.userId || "—"} /><Detail label="Admin ID" value={log.adminId || "—"} /><Detail label="IP" value={log.ipAddress || "—"} mono /><Detail label="User Agent" value={log.userAgent || "—"} /></div>
    <Separator /><section><Label>Message</Label><p className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">{log.message}</p></section>
    <JsonBlock title="Metadata JSON" value={log.metadata} />
    {log.stack ? <JsonBlock title="Stack trace" value={log.stack} plain /> : null}
  </>}</div></ScrollArea></SheetContent></Sheet>;
}

function CleanupDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const [mode, setMode] = React.useState("30");
  const [before, setBefore] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [matched, setMatched] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const payload = (dryRun: boolean) => mode === "range" ? { mode: "range", from: new Date(from).toISOString(), to: new Date(to).toISOString(), dryRun } : mode === "custom" ? { mode: "older_than", before: new Date(before).toISOString(), dryRun } : { mode: "older_than", days: Number(mode), dryRun };
  async function preview() { setBusy(true); try { const result = await cleanupSystemLogs(payload(true)); setMatched(result.matchedCount); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  async function remove() { setBusy(true); try { const result = await cleanupSystemLogs(payload(false)); toast.success(`Đã xóa ${result.deletedCount} log.`); onOpenChange(false); onDone(); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); setMatched(null); }}><DialogContent><DialogHeader><DialogTitle>Cleanup system logs</DialogTitle><DialogDescription>Chọn mốc thời gian, xem trước chính xác số log rồi mới xác nhận xóa.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-1.5"><Label>Phạm vi</Label><Select value={mode} onValueChange={(value) => { setMode(value); setMatched(null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[7,30,60,90].map((days) => <SelectItem key={days} value={String(days)}>Cũ hơn {days} ngày</SelectItem>)}<SelectItem value="custom">Cũ hơn ngày tùy chỉnh</SelectItem><SelectItem value="range">Trong khoảng thời gian</SelectItem></SelectContent></Select></div>{mode === "custom" ? <Input type="datetime-local" value={before} onChange={(e) => { setBefore(e.target.value); setMatched(null); }} /> : null}{mode === "range" ? <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Từ</Label><Input type="datetime-local" value={from} onChange={(e) => { setFrom(e.target.value); setMatched(null); }} /></div><div className="space-y-1.5"><Label>Đến</Label><Input type="datetime-local" value={to} onChange={(e) => { setTo(e.target.value); setMatched(null); }} /></div></div> : null}{matched !== null ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"><p className="font-medium">{number(matched)} log sẽ bị xóa</p><p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác.</p></div> : null}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>{matched === null ? <Button disabled={busy || (mode === "custom" && !before) || (mode === "range" && (!from || !to))} onClick={preview}>Đếm log</Button> : <Button variant="destructive" disabled={busy || matched === 0} onClick={remove}>{busy ? "Đang xóa…" : `Xác nhận xóa ${matched} log`}</Button>}</DialogFooter></DialogContent></Dialog>;
}

function SettingsDialog({ open, onOpenChange, initial, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; initial: SystemLogSettings; onDone: () => void }) {
  const [globalDays, setGlobalDays] = React.useState(initial.globalRetentionDays);
  const [categories, setCategories] = React.useState(initial.categories);
  const [days, setDays] = React.useState<Record<string, number>>(() => Object.fromEntries(initial.rules.map((rule) => [rule.scope, rule.retentionDays])));
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() => Object.fromEntries(initial.rules.map((rule) => [rule.scope, rule.enabled])));
  const [newKey, setNewKey] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scopes = [...categories.map((category) => `CATEGORY:${category.key}`), "LEVEL:DEBUG"];
  async function save() { setBusy(true); try { await Promise.all(categories.map((category) => updateSystemLogCategory(category.id, { name: category.name, description: category.description || "", isActive: category.isActive, sortOrder: category.sortOrder }))); await updateSystemLogSettings({ globalRetentionDays: globalDays, rules: scopes.map((scope) => ({ scope, retentionDays: days[scope] || globalDays, enabled: enabled[scope] ?? Boolean(days[scope]) })) }); toast.success("Đã cập nhật retention và category."); onOpenChange(false); onDone(); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  async function addCategory() { setBusy(true); try { await createSystemLogCategory({ key: newKey.toUpperCase(), name: newName, isActive: true, sortOrder: (categories.length + 1) * 10 }); toast.success("Đã thêm category."); setNewKey(""); setNewName(""); onDone(); onOpenChange(false); } catch (error) { toast.error(message(error)); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden"><DialogHeader><DialogTitle>System Log Settings</DialogTitle><DialogDescription>Retention theo category ưu tiên hơn level; level ưu tiên hơn global.</DialogDescription></DialogHeader><Tabs defaultValue="retention" className="min-h-0"><TabsList><TabsTrigger value="retention">Retention</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger></TabsList><ScrollArea className="mt-4 max-h-[58vh] pr-3"><TabsContent value="retention" className="m-0 space-y-4"><div className="flex items-center justify-between rounded-lg border p-4"><div><p className="font-medium">Global retention</p><p className="text-xs text-muted-foreground">Áp dụng khi không có override cụ thể.</p></div><DaysInput value={globalDays} onChange={setGlobalDays} /></div><div className="rounded-lg border">{scopes.map((scope, index) => <React.Fragment key={scope}>{index ? <Separator /> : null}<div className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-40"><p className="font-medium">{scope.replace("CATEGORY:", "").replace("LEVEL:", "")}</p><p className="text-xs text-muted-foreground">{scope.startsWith("LEVEL:") ? "Theo log level" : "Theo category"}</p></div><div className="flex items-center gap-3"><Switch checked={enabled[scope] ?? Boolean(days[scope])} onCheckedChange={(value) => setEnabled((current) => ({ ...current, [scope]: value }))} /><DaysInput value={days[scope] || globalDays} onChange={(value) => setDays((current) => ({ ...current, [scope]: value }))} /></div></div></React.Fragment>)}</div></TabsContent><TabsContent value="categories" className="m-0 space-y-4"><div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-[1fr_1.5fr_auto]"><Input placeholder="KEY_MOI" value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} /><Input placeholder="Tên hiển thị" value={newName} onChange={(e) => setNewName(e.target.value)} /><Button disabled={busy || newKey.length < 2 || !newName.trim()} onClick={addCategory}>Thêm</Button></div><div className="rounded-lg border">{categories.map((category, index) => <React.Fragment key={category.id}>{index ? <Separator /> : null}<div className="grid items-center gap-3 p-4 sm:grid-cols-[110px_1fr_auto]"><code className="text-xs font-semibold">{category.key}</code><div className="space-y-2"><Input value={category.name} onChange={(e) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: e.target.value } : item))} /><Input value={category.description || ""} onChange={(e) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, description: e.target.value } : item))} placeholder="Mô tả" /></div><Switch checked={category.isActive} onCheckedChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, isActive: value } : item))} /></div></React.Fragment>)}</div></TabsContent></ScrollArea></Tabs><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={busy} onClick={save}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</Button></DialogFooter></DialogContent></Dialog>;
}

function DaysInput({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <div className="flex items-center gap-2"><Input className="w-24" type="number" min={1} max={3650} value={value} onChange={(e) => onChange(Number(e.target.value))} /><span className="text-sm text-muted-foreground">ngày</span></div>; }
function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) { return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><div className={`mt-1 break-all text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</div></div>; }
function JsonBlock({ title, value, plain }: { title: string; value: unknown; plain?: boolean }) { const text = plain ? String(value) : JSON.stringify(value, null, 2); return <section><div className="mb-2 flex items-center justify-between"><Label>{title}</Label><Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success("Đã sao chép."))}><Clipboard /> Copy</Button></div><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-5">{text}</pre></section>; }
function Actor({ log }: { log: SystemLog }) { const actor = log.admin || log.user; return actor ? <div className="max-w-52"><p className="truncate text-sm font-medium">{actor.name}</p><p className="truncate text-xs text-muted-foreground">{log.admin ? "Admin" : "User"} #{actor.id} · {actor.email}</p></div> : <span className="text-muted-foreground">—</span>; }
function LevelBadge({ level }: { level: SystemLog["level"] }) { const styles = { info: "border-blue-500/30 text-blue-700 dark:text-blue-400", warn: "border-amber-500/30 text-amber-700 dark:text-amber-400", error: "border-red-500/30 text-red-700 dark:text-red-400", debug: "border-violet-500/30 text-violet-700 dark:text-violet-400" }; return <Badge variant="outline" className={styles[level]}>{level}</Badge>; }
function date(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value)); }
function time(value: string) { return new Intl.DateTimeFormat("vi-VN", { timeStyle: "medium" }).format(new Date(value)); }
function number(value: number) { return new Intl.NumberFormat("vi-VN").format(value); }
function localDate(value?: string | null) { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function message(error: unknown) { return error instanceof Error ? error.message : String(error); }
