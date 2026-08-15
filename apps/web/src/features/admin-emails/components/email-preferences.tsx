"use client";

import * as React from "react";
import { LoaderCircle, LockKeyhole, Pencil, Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { createEmailPreferenceTopic, listEmailPreferenceTopics, updateEmailPreferenceTopic } from "../api/emails.client";
import type { EmailCategory, EmailPreferenceTopic } from "../types";
import { EmailEmptyState, EmailStatusBadge } from "./email-ui";

export function EmailPreferencesTab() {
  const permissions = useAdminPermissions();
  const canManage = permissions.includes("emails.preferences.manage");
  const [items, setItems] = React.useState<EmailPreferenceTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EmailPreferenceTopic | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setItems(await listEmailPreferenceTopics()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải preference topics."); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Email preference topics</h2><p className="text-sm text-muted-foreground">Quản lý taxonomy opt-in. Không chỉnh preference hàng loạt theo user trong phase này.</p></div><div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => void load()} aria-label="Làm mới topics"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>{canManage ? <Button onClick={() => setCreateOpen(true)}><Plus />New topic</Button> : null}</div></div>
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto"><Table className="min-w-[900px]"><TableHeader><TableRow><TableHead>Topic</TableHead><TableHead>Category</TableHead><TableHead>Required</TableHead><TableHead>Status</TableHead><TableHead>Order</TableHead><TableHead>Audience data</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={7} className="h-52 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow> : items.length ? items.map((topic) => <TableRow key={topic.id}>
          <TableCell><div className="max-w-md"><div className="flex items-center gap-2"><p className="font-medium">{topic.name}</p><code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{topic.code}</code></div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{topic.description}</p></div></TableCell>
          <TableCell className="capitalize">{topic.category}</TableCell>
          <TableCell>{topic.isRequired ? <Badge variant="outline"><LockKeyhole />Required</Badge> : <span className="text-xs text-muted-foreground">Optional</span>}</TableCell>
          <TableCell><EmailStatusBadge status={topic.isEnabled ? "active" : "disabled"} label={topic.isEnabled ? "Enabled" : "Disabled"} /></TableCell>
          <TableCell className="tabular-nums">{topic.displayOrder}</TableCell>
          <TableCell>{topic.hasPreferenceData ? <div className="flex items-center gap-3 text-xs"><span className="text-success">{topic.optedIn} opted-in</span><span className="text-muted-foreground">{topic.optedOut} opted-out</span></div> : <span className="text-xs text-muted-foreground">Chưa có dữ liệu</span>}</TableCell>
          <TableCell className="text-right">{canManage ? <Button variant="ghost" size="icon-sm" onClick={() => setEditing(topic)} aria-label={`Edit ${topic.name}`}><Pencil /></Button> : null}</TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={7} className="p-0"><EmailEmptyState title="Chưa có preference topic" description="Tạo taxonomy transactional và marketing trước khi triển khai User Settings." /></TableCell></TableRow>}
      </TableBody></Table></div>
    </Card>
    <PreferenceTopicDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => void load()} />
    <PreferenceTopicDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} topic={editing} onSaved={() => { setEditing(null); void load(); }} />
  </div>;
}

function PreferenceTopicDialog({ open, onOpenChange, topic, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; topic?: EmailPreferenceTopic | null; onSaved: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", name: "", description: "", category: "marketing" as EmailCategory, isRequired: false, isEnabled: true, displayOrder: 100 });
  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (topic) setForm({ code: topic.code, name: topic.name, description: topic.description, category: topic.category, isRequired: topic.isRequired, isEnabled: topic.isEnabled, displayOrder: topic.displayOrder });
      else if (open) setForm({ code: "", name: "", description: "", category: "marketing", isRequired: false, isEnabled: true, displayOrder: 100 });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open, topic]);
  async function save() {
    setSaving(true);
    try {
      if (topic) await updateEmailPreferenceTopic(topic.id, { name: form.name, description: form.description, isEnabled: form.isEnabled, displayOrder: form.displayOrder });
      else await createEmailPreferenceTopic(form);
      toast.success(topic ? "Đã cập nhật preference topic." : "Đã tạo preference topic."); onSaved(); onOpenChange(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu topic."); }
    finally { setSaving(false); }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{topic ? "Edit preference topic" : "New preference topic"}</DialogTitle><DialogDescription>Code là immutable sau khi topic được tạo và sử dụng.</DialogDescription></DialogHeader><div className="grid gap-4"><div className="space-y-2"><Label htmlFor="topic-code">Code</Label><Input id="topic-code" disabled={Boolean(topic)} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="product_updates" /></div><div className="space-y-2"><Label htmlFor="topic-name">Name</Label><Input id="topic-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="topic-description">Description</Label><Textarea id="topic-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Category</Label><Select disabled={Boolean(topic)} value={form.category} onValueChange={(value) => setForm({ ...form, category: value as EmailCategory, isRequired: value === "marketing" ? false : form.isRequired })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="transactional">Transactional</SelectItem><SelectItem value="marketing">Marketing</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="topic-order">Display order</Label><Input id="topic-order" type="number" min={0} value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} /></div></div><div className="flex items-start justify-between gap-4 rounded-lg border p-3"><div><p className="text-sm font-medium">Required topic</p><p className="text-xs text-muted-foreground">User không thể unsubscribe. Marketing luôn optional.</p></div><Switch checked={form.isRequired} disabled={Boolean(topic) || form.category === "marketing"} onCheckedChange={(checked) => setForm({ ...form, isRequired: checked, isEnabled: checked ? true : form.isEnabled })} /></div><div className="flex items-start justify-between gap-4 rounded-lg border p-3"><div><p className="text-sm font-medium">Enabled</p><p className="text-xs text-muted-foreground">Topic required không thể tắt.</p></div><Switch checked={form.isEnabled} disabled={form.isRequired} onCheckedChange={(checked) => setForm({ ...form, isEnabled: checked })} /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving || !form.code || !form.name || !form.description} onClick={() => void save()}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}Save topic</Button></DialogFooter></DialogContent></Dialog>;
}
