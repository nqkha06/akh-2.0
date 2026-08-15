"use client";

import * as React from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  LoaderCircle,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  archiveEmailTemplate,
  createEmailTemplate,
  getEmailTemplateVersions,
  listEmailSenders,
  listEmailTemplates,
  previewEmailTemplate,
  restoreEmailTemplateVersion,
  sendTemplateTest,
  updateEmailTemplate,
  type EmailTemplatePayload,
} from "../api/emails.client";
import type { EmailCategory, EmailSender, EmailTemplate, EmailTemplateVariable, EmailTemplateVersion } from "../types";
import { EmailEmptyState, EmailStatusBadge, formatEmailDate } from "./email-ui";

const emptyTemplate: EmailTemplatePayload & { code: string } = {
  code: "",
  name: "",
  description: "",
  category: "transactional",
  status: "draft",
  subject: "",
  preheader: "",
  htmlContent: "<h1>Xin chào {{user.name}}</h1>\n<p>Nội dung email của bạn.</p>",
  textContent: "",
  variables: [{ key: "user.name", label: "Tên người dùng", type: "string", required: true, example: "Nguyễn An", description: "Tên hiển thị." }],
  senderId: null,
};

export function EmailTemplatesTab() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("emails.templates.create");
  const canUpdate = permissions.includes("emails.templates.update");
  const canDelete = permissions.includes("emails.templates.delete");
  const canTest = permissions.includes("emails.test.send");
  const [items, setItems] = React.useState<EmailTemplate[]>([]);
  const [senders, setSenders] = React.useState<EmailSender[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({ page: 1, perPage: 20, total: 0, totalPages: 1 });
  const [editing, setEditing] = React.useState<EmailTemplate | "new" | null>(null);
  const [testTemplate, setTestTemplate] = React.useState<EmailTemplate | null>(null);
  const [versionsTemplate, setVersionsTemplate] = React.useState<EmailTemplate | null>(null);
  const [archiving, setArchiving] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [templatesResult, sendersResult] = await Promise.all([
        listEmailTemplates({ search, category, status, page }),
        listEmailSenders({ page: 1 }),
      ]);
      setItems(templatesResult.items); setPagination(templatesResult.pagination); setSenders(sendersResult.items);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải template."); }
    finally { setLoading(false); }
  }, [category, page, search, status]);
  React.useEffect(() => { const timeout = window.setTimeout(() => void load(), 200); return () => window.clearTimeout(timeout); }, [load]);

  async function archive(template: EmailTemplate) {
    setArchiving(template.id);
    try { await archiveEmailTemplate(template.id); toast.success("Đã archive template."); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể archive template."); }
    finally { setArchiving(null); }
  }

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Email templates</h2><p className="text-sm text-muted-foreground">Variable schema, safe HTML, test send và immutable version history.</p></div>{canCreate ? <Button onClick={() => setEditing("new")}><Plus />New template</Button> : null}</div>
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center"><div className="relative min-w-56 flex-1 lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm name, code hoặc subject..." className="pl-9" /></div><Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi category</SelectItem><SelectItem value="transactional">Transactional</SelectItem><SelectItem value="marketing">Marketing</SelectItem></SelectContent></Select><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select><Button variant="outline" size="icon" onClick={() => void load()} aria-label="Làm mới templates"><RefreshCw className={loading ? "animate-spin" : ""} /></Button></div>
      <div className="overflow-x-auto"><Table className="min-w-[1050px]"><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Sender</TableHead><TableHead>Version</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={8} className="h-52 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow> : items.length ? items.map((template) => <TableRow key={template.id}><TableCell><div className="max-w-72"><p className="truncate text-sm font-medium">{template.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{template.subject}</p></div></TableCell><TableCell><code className="rounded bg-muted px-1.5 py-1 text-xs">{template.code}</code></TableCell><TableCell className="capitalize">{template.category}</TableCell><TableCell><EmailStatusBadge status={template.status} /></TableCell><TableCell><div className="max-w-52"><p className="truncate text-sm">{template.sender?.displayName || "Default sender"}</p><p className="truncate text-xs text-muted-foreground">{template.sender?.emailAddress || template.category}</p></div></TableCell><TableCell><Badge variant="outline">v{template.version}</Badge></TableCell><TableCell><p className="text-xs">{formatEmailDate(template.updatedAt)}</p><p className="mt-1 text-xs text-muted-foreground">{template.updatedBy?.name || "System"}</p></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={() => setEditing(template)} aria-label={`Preview ${template.name}`}>{canUpdate ? <Pencil /> : <Eye />}</Button><Button variant="ghost" size="icon-sm" onClick={() => setVersionsTemplate(template)} aria-label={`Versions ${template.name}`}><History /></Button>{canTest && template.status !== "archived" ? <Button variant="ghost" size="icon-sm" onClick={() => setTestTemplate(template)} aria-label={`Send test ${template.name}`}><Send /></Button> : null}{canDelete && template.status !== "archived" ? <Button variant="ghost" size="icon-sm" className="hover:text-destructive" disabled={archiving === template.id} onClick={() => void archive(template)} aria-label={`Archive ${template.name}`}><Archive /></Button> : null}</div></TableCell></TableRow>) : <TableRow><TableCell colSpan={8} className="p-0"><EmailEmptyState title="Chưa có template phù hợp" description="Tạo template mới hoặc thay đổi bộ lọc hiện tại." action={canCreate ? <Button onClick={() => setEditing("new")}><Plus />New template</Button> : undefined} /></TableCell></TableRow>}
      </TableBody></Table></div>
      {pagination.total > 0 ? <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>{pagination.total} templates · Trang {pagination.page}/{pagination.totalPages}</span><div className="flex gap-1"><Button variant="outline" size="icon-sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div> : null}
    </Card>
    <TemplateBuilderDialog template={editing === "new" ? null : editing} open={Boolean(editing)} readOnly={!canUpdate && editing !== "new"} senders={senders} onOpenChange={(open) => !open && setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    <TestEmailDialog template={testTemplate} open={Boolean(testTemplate)} onOpenChange={(open) => !open && setTestTemplate(null)} />
    <VersionHistoryDialog template={versionsTemplate} open={Boolean(versionsTemplate)} canRestore={canUpdate} onOpenChange={(open) => !open && setVersionsTemplate(null)} onRestored={() => { setVersionsTemplate(null); void load(); }} />
  </div>;
}

export function QuickTestEmailDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  React.useEffect(() => { if (open) void listEmailTemplates({ page: 1 }).then((result) => { const eligible = result.items.filter((item) => item.status !== "archived"); setTemplates(eligible); setSelectedId(String(eligible[0]?.id || "")); }).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải templates.")); }, [open]);
  const template = templates.find((item) => String(item.id) === selectedId) || null;
  return <TestEmailDialog open={open} onOpenChange={onOpenChange} template={template} templateSelector={<Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn template" /></SelectTrigger><SelectContent>{templates.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} · v{item.version}</SelectItem>)}</SelectContent></Select>} />;
}

function TemplateBuilderDialog({ template, open, readOnly, senders, onOpenChange, onSaved }: { template: EmailTemplate | null; open: boolean; readOnly: boolean; senders: EmailSender[]; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = React.useState(emptyTemplate);
  const [saving, setSaving] = React.useState(false);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = React.useState<{ subject: string; html: string; text: string } | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setForm(template ? { code: template.code, name: template.name, description: template.description || "", category: template.category, status: template.status, subject: template.subject, preheader: template.preheader || "", htmlContent: template.htmlContent, textContent: template.textContent, variables: template.variables, senderId: template.senderId } : structuredClone(emptyTemplate));
      setPreview(null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open, template]);
  const sampleData = React.useMemo(() => Object.fromEntries(form.variables.map((variable) => [variable.key, variable.example ?? `{{${variable.key}}}`])), [form.variables]);
  const localPreview = { subject: renderClient(form.subject, sampleData), html: safePreviewHtml(renderClient(form.htmlContent, sampleData)), text: renderClient(form.textContent || "", sampleData) };
  async function save() { setSaving(true); try { if (template) await updateEmailTemplate(template.id, form); else await createEmailTemplate({ ...form, code: form.code }); toast.success(template ? "Đã cập nhật template." : "Đã tạo template."); onSaved(); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu template."); } finally { setSaving(false); } }
  async function serverPreview() { if (!template) { setPreview(localPreview); return; } try { const result = await previewEmailTemplate(template.id, sampleData); setPreview({ subject: result.subject, html: result.html, text: result.text }); toast.success("Preview đã được render từ server."); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể preview."); } }
  const rendered = preview || localPreview;
  const eligibleSenders = senders.filter((sender) => sender.type === form.category && sender.status !== "disabled");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="h-[92vh] max-h-[92vh] overflow-hidden p-0 sm:max-w-[min(96vw,1500px)]"><DialogHeader className="border-b px-5 py-4"><div className="flex items-center justify-between gap-4 pr-8"><div><DialogTitle>{template ? `Edit ${template.name}` : "New email template"}</DialogTitle><DialogDescription>Code immutable · server-side sanitize · immutable publish snapshots.</DialogDescription></div><div className="flex gap-2"><Button variant="outline" onClick={() => void serverPreview()}><Eye />Preview sample</Button>{!readOnly ? <Button onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}Save</Button> : null}</div></div></DialogHeader><div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(480px,1fr)_minmax(420px,0.9fr)]"><ScrollArea className="h-[calc(92vh-90px)] border-r"><div className="space-y-6 p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Template name"><Input disabled={readOnly} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Code"><Input disabled={readOnly || Boolean(template)} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="account_security_alert" /></Field><Field label="Category"><Select disabled={readOnly} value={form.category} onValueChange={(value) => setForm({ ...form, category: value as EmailCategory, senderId: null })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="transactional">Transactional</SelectItem><SelectItem value="marketing">Marketing</SelectItem></SelectContent></Select></Field><Field label="Status"><Select disabled={readOnly} value={form.status} onValueChange={(value) => setForm({ ...form, status: value as EmailTemplate["status"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active / publish</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></Field></div><Field label="Description"><Textarea disabled={readOnly} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Subject"><Input disabled={readOnly} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field><Field label="Preheader"><Input disabled={readOnly} value={form.preheader || ""} onChange={(event) => setForm({ ...form, preheader: event.target.value })} /></Field></div><Field label="Sender"><Select disabled={readOnly} value={form.senderId ? String(form.senderId) : "default"} onValueChange={(value) => setForm({ ...form, senderId: value === "default" ? null : Number(value) })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Default {form.category} sender</SelectItem>{eligibleSenders.map((sender) => <SelectItem key={sender.id} value={String(sender.id)}>{sender.displayName} &lt;{sender.emailAddress}&gt; · {sender.status}</SelectItem>)}</SelectContent></Select></Field><VariablesEditor variables={form.variables} disabled={readOnly} onChange={(variables) => setForm({ ...form, variables })} /><Field label="HTML content"><Textarea disabled={readOnly} value={form.htmlContent} onChange={(event) => setForm({ ...form, htmlContent: event.target.value })} className="min-h-72 font-mono text-xs leading-5" /></Field><Field label="Plain-text fallback"><Textarea disabled={readOnly} value={form.textContent || ""} onChange={(event) => setForm({ ...form, textContent: event.target.value })} className="min-h-40 font-mono text-xs leading-5" placeholder="Để trống để backend tự generate từ HTML." /></Field></div></ScrollArea><div className="min-h-0 bg-muted/20 p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">Preview</p><p className="text-xs text-muted-foreground">Sample data từ variable schema.</p></div><Tabs value={device} onValueChange={(value) => setDevice(value as typeof device)}><TabsList><TabsTrigger value="desktop"><Monitor /></TabsTrigger><TabsTrigger value="mobile"><Smartphone /></TabsTrigger></TabsList></Tabs></div><div className={`mx-auto overflow-hidden rounded-xl border bg-white shadow-sm transition-[max-width] ${device === "mobile" ? "max-w-[390px]" : "max-w-full"}`}><div className="border-b bg-muted/30 px-4 py-3 text-black"><p className="truncate text-sm font-medium">{rendered.subject || "Chưa có subject"}</p><p className="mt-1 truncate text-xs text-neutral-500">{renderClient(form.preheader || "", sampleData) || "Preheader"}</p></div><iframe title="Email preview" sandbox="" srcDoc={rendered.html} className="h-[620px] w-full bg-white" /></div></div></div></DialogContent></Dialog>;
}

function VariablesEditor({ variables, disabled, onChange }: { variables: EmailTemplateVariable[]; disabled: boolean; onChange: (variables: EmailTemplateVariable[]) => void }) {
  function update(index: number, patch: Partial<EmailTemplateVariable>) { onChange(variables.map((variable, position) => position === index ? { ...variable, ...patch } : variable)); }
  return <div className="space-y-3"><div className="flex items-center justify-between"><div><Label>Variable schema</Label><p className="mt-1 text-xs text-muted-foreground">Mọi biến dùng trong subject/HTML/text phải được khai báo.</p></div>{!disabled ? <Button type="button" variant="outline" size="sm" onClick={() => onChange([...variables, { key: "variable", label: "Biến mới", type: "string", required: false, example: "Sample", description: "" }])}><Plus />Add variable</Button> : null}</div><div className="space-y-2">{variables.map((variable, index) => <div key={`${index}-${variable.key}`} className="grid gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_120px_100px_36px]"><Input disabled={disabled} value={variable.key} onChange={(event) => update(index, { key: event.target.value })} placeholder="user.name" className="font-mono text-xs" /><Input disabled={disabled} value={variable.label} onChange={(event) => update(index, { label: event.target.value })} placeholder="Label" /><Select disabled={disabled} value={variable.type} onValueChange={(value) => update(index, { type: value as EmailTemplateVariable["type"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["string","number","date","url","currency"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Input disabled={disabled} value={String(variable.example ?? "")} onChange={(event) => update(index, { example: event.target.value })} placeholder="Example" /><Button disabled={disabled} variant="ghost" size="icon-sm" onClick={() => onChange(variables.filter((_, position) => position !== index))}><Trash2 /></Button><div className="flex items-center gap-2 sm:col-span-5"><Switch disabled={disabled} checked={variable.required} onCheckedChange={(required) => update(index, { required })} /><span className="text-xs text-muted-foreground">Required</span><Input disabled={disabled} value={variable.description || ""} onChange={(event) => update(index, { description: event.target.value })} placeholder="Description" className="ml-2" /></div></div>)}</div></div>;
}

function TestEmailDialog({ template, open, onOpenChange, templateSelector }: { template: EmailTemplate | null; open: boolean; onOpenChange: (open: boolean) => void; templateSelector?: React.ReactNode }) {
  const [recipient, setRecipient] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  React.useEffect(() => {
    if (open) return;
    const timeout = window.setTimeout(() => { setRecipient(""); setConfirming(false); }, 0);
    return () => window.clearTimeout(timeout);
  }, [open]);
  async function send() { if (!template) return; setSending(true); try { await sendTemplateTest(template.id, recipient); toast.success(`Đã gửi test email tới ${recipient}.`); onOpenChange(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể gửi test email."); } finally { setSending(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{confirming ? "Confirm test email" : "Send test email"}</DialogTitle><DialogDescription>{confirming ? "Kiểm tra recipient, sender và subject trước khi gọi Amazon SES." : "Test send được ghi vào Activity với type test."}</DialogDescription></DialogHeader>{!confirming ? <div className="space-y-4">{templateSelector}<Field label="Recipient email"><Input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="qa@example.com" /></Field>{template ? <div className="rounded-lg border bg-muted/20 p-3"><p className="text-sm font-medium">{template.name} · v{template.version}</p><p className="mt-1 text-xs text-muted-foreground">{template.subject}</p></div> : <Alert><AlertTitle>Chưa chọn template</AlertTitle><AlertDescription>Chọn một template có thể preview để tiếp tục.</AlertDescription></Alert>}</div> : template ? <div className="space-y-3 rounded-xl border bg-muted/20 p-4"><ConfirmRow label="Recipient" value={recipient} /><ConfirmRow label="Sender" value={template.sender?.emailAddress || `Default ${template.category} sender`} /><ConfirmRow label="Subject" value={template.subject} /><ConfirmRow label="Template" value={`${template.code} · v${template.version}`} /></div> : null}<DialogFooter>{confirming ? <Button variant="outline" onClick={() => setConfirming(false)}>Back</Button> : null}<Button disabled={!template || !recipient.includes("@") || sending} onClick={() => confirming ? void send() : setConfirming(true)}>{sending ? <LoaderCircle className="animate-spin" /> : <Send />}{confirming ? "Send via Amazon SES" : "Review test"}</Button></DialogFooter></DialogContent></Dialog>;
}

function VersionHistoryDialog({ template, open, canRestore, onOpenChange, onRestored }: { template: EmailTemplate | null; open: boolean; canRestore: boolean; onOpenChange: (open: boolean) => void; onRestored: () => void }) {
  const [versions, setVersions] = React.useState<EmailTemplateVersion[]>([]); const [loading, setLoading] = React.useState(false); const [restoring, setRestoring] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!open || !template) return;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      void getEmailTemplateVersions(template.id).then(setVersions).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải versions.")).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open, template]);
  async function restore(version: number) { if (!template) return; setRestoring(version); try { await restoreEmailTemplateVersion(template.id, version); toast.success(`Đã restore v${version} thành version mới.`); onRestored(); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể restore version."); } finally { setRestoring(null); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Version history · {template?.name}</DialogTitle><DialogDescription>Snapshot immutable. Restore luôn tạo version mới, không overwrite lịch sử.</DialogDescription></DialogHeader>{loading ? <div className="flex h-40 items-center justify-center"><LoaderCircle className="animate-spin" /></div> : versions.length ? <div className="divide-y rounded-xl border">{versions.map((version) => <div key={version.id} className="flex items-center justify-between gap-4 p-4"><div><div className="flex items-center gap-2"><Badge variant="outline">v{version.version}</Badge><p className="font-medium">{version.subject}</p></div><p className="mt-1 text-xs text-muted-foreground">Published {formatEmailDate(version.createdAt)}</p></div>{canRestore && version.version !== template?.version ? <Button size="sm" variant="outline" disabled={restoring === version.version} onClick={() => void restore(version.version)}>{restoring === version.version ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}Restore</Button> : null}</div>)}</div> : <EmailEmptyState title="Chưa có published version" description="Version snapshot được tạo khi template được activate/publish." />}</DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function ConfirmRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="max-w-xs text-right text-sm font-medium">{value}</span></div>; }
function renderClient(content: string, sample: Record<string, unknown>) { return content.replace(/{{\s*([a-zA-Z][a-zA-Z0-9.]*)\s*}}/g, (_match, key: string) => String(sample[key] ?? `{{${key}}}`)); }
function safePreviewHtml(html: string) { return html.replace(/<\/?(?:script|iframe)[^>]*>/gi, "").replace(/\son\w+\s*=\s*(["']).*?\1/gi, "").replace(/javascript:/gi, ""); }
