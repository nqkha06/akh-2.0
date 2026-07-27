"use client";

import { Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BioBankDetailsBlockDto } from "@/lib/api-client";

export function BankDetailsBlockEditor({
  block,
  disabled,
  onChange,
}: {
  block: BioBankDetailsBlockDto;
  disabled?: boolean;
  onChange: (block: BioBankDetailsBlockDto) => void;
}) {
  const patch = (value: Partial<BioBankDetailsBlockDto>) => onChange({ ...block, ...value });

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5 rounded-lg border border-border bg-muted/35 px-3 py-2.5 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><p>Thông tin bạn nhập sẽ hiển thị công khai khi trang được xuất bản. Chỉ nhập thông tin dùng để nhận chuyển khoản.</p></div>
      <div className="grid gap-2"><Label htmlFor={`bank-title-${block.id}`}>Tiêu đề</Label><Input id={`bank-title-${block.id}`} value={block.title} maxLength={120} disabled={disabled} onChange={(event) => patch({ title: event.target.value })} placeholder="Thông tin chuyển khoản" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor={`bank-name-${block.id}`}>Tên ngân hàng <span className="text-destructive">*</span></Label><Input id={`bank-name-${block.id}`} value={block.bankName} maxLength={120} disabled={disabled} onChange={(event) => patch({ bankName: event.target.value })} placeholder="Ví dụ: Vietcombank" /></div>
        <div className="grid gap-2"><Label htmlFor={`bank-branch-${block.id}`}>Chi nhánh</Label><Input id={`bank-branch-${block.id}`} value={block.branch || ""} maxLength={120} disabled={disabled} onChange={(event) => patch({ branch: event.target.value })} placeholder="Không bắt buộc" /></div>
        <div className="grid gap-2"><Label htmlFor={`bank-account-name-${block.id}`}>Tên chủ tài khoản <span className="text-destructive">*</span></Label><Input id={`bank-account-name-${block.id}`} value={block.accountName} maxLength={160} disabled={disabled} onChange={(event) => patch({ accountName: event.target.value })} placeholder="NGUYEN VAN A" /></div>
        <div className="grid gap-2"><Label htmlFor={`bank-account-number-${block.id}`}>Số tài khoản <span className="text-destructive">*</span></Label><Input id={`bank-account-number-${block.id}`} value={block.accountNumber} maxLength={80} inputMode="numeric" autoComplete="off" disabled={disabled} onChange={(event) => patch({ accountNumber: event.target.value })} placeholder="0123456789" /></div>
      </div>
      <div className="grid gap-2"><Label htmlFor={`bank-note-${block.id}`}>Nội dung hoặc ghi chú</Label><Textarea id={`bank-note-${block.id}`} value={block.note || ""} maxLength={300} disabled={disabled} onChange={(event) => patch({ note: event.target.value })} placeholder="Ví dụ: Nội dung chuyển khoản hoặc lời nhắn cho người xem" className="min-h-20 resize-y" /></div>
      <div className="flex items-center justify-between gap-4"><div><Label htmlFor={`bank-copy-${block.id}`}>Cho phép sao chép số tài khoản</Label><p className="mt-1 text-xs text-muted-foreground">Hiển thị nút sao chép trên trang công khai.</p></div><Switch id={`bank-copy-${block.id}`} size="sm" checked={block.showCopyButton} disabled={disabled} onCheckedChange={(showCopyButton) => patch({ showCopyButton })} /></div>
    </div>
  );
}
