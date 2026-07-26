"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FilePlus2, LoaderCircle, Paperclip, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

import { categoryLabels } from "./support-data-source";
import type { CreateSupportRequestInput, SupportCategory } from "./types";
import type { SupportController } from "./use-support-controller";
import { formatSupportDate } from "./use-support-controller";

const initialForm: Omit<CreateSupportRequestInput, "attachments"> = { category: "usage", subject: "", content: "", relatedResource: "none", attachTechnicalInfo: true };

export function SupportAttachmentUploader({ files, onChange, acceptedTypes, maxSizeMb, disabled }: { files: File[]; onChange: (files: File[]) => void; acceptedTypes: string; maxSizeMb: number; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const selected = Array.from(incoming);
    const oversized = selected.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (oversized) {
      setError(`${oversized.name} vượt quá dung lượng tối đa ${maxSizeMb} MB.`);
      return;
    }
    setError("");
    onChange([...files, ...selected].slice(0, 5));
  };
  return <div><input ref={inputRef} type="file" className="sr-only" accept={acceptedTypes} multiple disabled={disabled} onChange={(event) => addFiles(event.target.files)} /><button type="button" disabled={disabled} className="flex min-h-24 w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 py-4 text-center outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" onClick={() => inputRef.current?.click()}><span><FilePlus2 className="mx-auto size-5 text-muted-foreground" /><span className="mt-2 block text-sm font-medium">Chọn ảnh chụp hoặc tài liệu</span><span className="mt-1 block text-xs text-muted-foreground">Tối đa 5 file · {maxSizeMb} MB mỗi file</span></span></button>{files.length ? <div className="mt-2 divide-y divide-border rounded-md border border-border">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex min-h-11 items-center gap-2 px-3 py-2"><Paperclip className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><span className="text-[11px] tabular-nums text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span><Button type="button" variant="ghost" size="icon-sm" aria-label={`Xóa ${file.name}`} disabled={disabled} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}><Trash2 /></Button></div>)}</div> : null}{error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}</div>;
}

export function CreateSupportRequestSheet({ controller }: { controller: SupportController }) {
  const brand = useSiteBrand();
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const data = controller.data;
  if (!data) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.subject.trim()) nextErrors.subject = "Vui lòng nhập tiêu đề.";
    else if (form.subject.trim().length < 8) nextErrors.subject = "Tiêu đề cần ít nhất 8 ký tự.";
    if (!form.content.trim()) nextErrors.content = "Vui lòng mô tả vấn đề.";
    else if (form.content.trim().length < 20) nextErrors.content = "Nội dung cần ít nhất 20 ký tự để đội ngũ hỗ trợ có đủ thông tin.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await controller.createRequest({ ...form, subject: form.subject.trim(), content: form.content.trim(), attachments });
  };

  const close = () => {
    controller.setRequestSheetOpen(false);
    controller.setSuccessRequest(undefined);
    setForm(initialForm);
    setAttachments([]);
    setErrors({});
  };

  return (
    <Sheet
      open={controller.requestSheetOpen}
      onOpenChange={(open) => {
        if (controller.submitting) return;
        if (open) controller.setRequestSheetOpen(true);
        else close();
      }}
    >
      <SheetContent id="create-support-request" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-5 sm:px-6">
          <SheetTitle>{controller.successRequest ? "Yêu cầu hỗ trợ đã được gửi" : "Gửi yêu cầu hỗ trợ"}</SheetTitle>
          <SheetDescription>
            {controller.successRequest
              ? "Thông tin yêu cầu đã được cập nhật trong danh sách của bạn."
              : `Cung cấp đủ thông tin để đội ngũ ${brand.siteName} có thể hỗ trợ nhanh hơn.`}
          </SheetDescription>
        </SheetHeader>

        {controller.successRequest ? (
          <SupportRequestSuccess controller={controller} onClose={close} />
        ) : (
          <>
            <form id="create-support-request-form" onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-6">
              <div className="space-y-2">
                <label htmlFor="support-category" className="text-sm font-medium">Loại yêu cầu</label>
                <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value as SupportCategory }))} disabled={controller.submitting}>
                  <SelectTrigger id="support-category" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="support-subject" className="text-sm font-medium">Tiêu đề</label>
                <Input id="support-subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Mô tả ngắn vấn đề của bạn" aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "support-subject-error" : undefined} disabled={controller.submitting} className="h-10" />
                {errors.subject ? <p id="support-subject-error" role="alert" className="text-xs text-destructive">{errors.subject}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="support-content" className="text-sm font-medium">Nội dung</label>
                <Textarea id="support-content" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Hãy mô tả vấn đề, kết quả mong đợi và các bước đã thử..." className="min-h-32 resize-y" aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? "support-content-error" : undefined} disabled={controller.submitting} />
                {errors.content ? <p id="support-content-error" role="alert" className="text-xs text-destructive">{errors.content}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="support-resource" className="text-sm font-medium">Trang hoặc đối tượng liên quan</label>
                <Select value={form.relatedResource} onValueChange={(value) => setForm((current) => ({ ...current, relatedResource: value }))} disabled={controller.submitting}>
                  <SelectTrigger id="support-resource" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Không có</SelectItem><SelectItem value="social-link">Social link</SelectItem><SelectItem value="file">File</SelectItem><SelectItem value="link-in-bio">Link-in-bio</SelectItem><SelectItem value="withdrawal">Giao dịch rút tiền</SelectItem><SelectItem value="reward">Phần thưởng</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Tệp đính kèm</span>
                <SupportAttachmentUploader files={attachments} onChange={setAttachments} acceptedTypes={data.attachmentConfig.acceptedTypes} maxSizeMb={data.attachmentConfig.maxSizeMb} disabled={controller.submitting} />
              </div>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3">
                <Checkbox checked={form.attachTechnicalInfo} onCheckedChange={(checked) => setForm((current) => ({ ...current, attachTechnicalInfo: checked === true }))} disabled={controller.submitting} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">Đính kèm thông tin kỹ thuật để hỗ trợ chẩn đoán</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">Chỉ gồm trình duyệt, hệ điều hành, route và phiên bản ứng dụng. Không gửi mật khẩu, token hoặc cookie.</span>
                </span>
              </label>
              {controller.submitError ? <Alert variant="destructive"><AlertCircle /><AlertDescription>{controller.submitError}</AlertDescription></Alert> : null}
            </form>
            <SheetFooter className="border-t border-border px-5 py-4 sm:px-6">
              <Button type="button" variant="outline" disabled={controller.submitting} onClick={close}>Hủy</Button>
              <Button type="submit" form="create-support-request-form" disabled={controller.submitting}>
                {controller.submitting ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />Đang gửi…</> : "Gửi yêu cầu"}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function SupportRequestSuccess({ controller, onClose }: { controller: SupportController; onClose: () => void }) {
  const request = controller.successRequest;
  if (!request) return null;
  return <div className="flex flex-1 flex-col px-5 py-6 sm:px-6"><div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></div><h3 className="mt-5 text-lg font-semibold">Yêu cầu hỗ trợ đã được gửi</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Đội ngũ hỗ trợ sẽ phản hồi trong chính yêu cầu này khi có cập nhật.</p><dl className="mt-6 divide-y divide-border border-y border-border text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Mã yêu cầu</dt><dd className="font-mono font-medium">{request.reference}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Tiêu đề</dt><dd className="max-w-[65%] text-right font-medium">{request.subject}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Trạng thái</dt><dd className="font-medium">Đã gửi</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Thời gian gửi</dt><dd className="text-right font-medium tabular-nums">{formatSupportDate(request.createdAt)}</dd></div></dl><div className="mt-auto grid gap-2 pt-8 sm:grid-cols-2"><Button variant="outline" onClick={() => { controller.setDetailRequest(request); controller.setRequestSheetOpen(false); controller.setSuccessRequest(undefined); }}>Xem yêu cầu</Button><Button onClick={onClose}>Đóng</Button></div></div>;
}
