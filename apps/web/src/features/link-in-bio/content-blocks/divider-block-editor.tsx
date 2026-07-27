"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BioDividerBlockDto } from "@/lib/api-client";

export function DividerBlockEditor({
  block,
  disabled,
  onChange,
}: {
  block: BioDividerBlockDto;
  disabled?: boolean;
  onChange: (block: BioDividerBlockDto) => void;
}) {
  const patch = (value: Partial<BioDividerBlockDto>) => onChange({ ...block, ...value });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><Label htmlFor={`divider-label-toggle-${block.id}`}>Hiển thị nhãn</Label><p className="mt-1 text-xs text-muted-foreground">Thêm một nhãn ngắn ở giữa đường phân cách.</p></div>
        <Switch id={`divider-label-toggle-${block.id}`} size="sm" checked={block.showLabel} disabled={disabled} onCheckedChange={(showLabel) => patch({ showLabel })} />
      </div>
      {block.showLabel ? <div className="grid gap-2"><Label htmlFor={`divider-label-${block.id}`}>Nhãn</Label><Input id={`divider-label-${block.id}`} value={block.label || ""} maxLength={80} disabled={disabled} onChange={(event) => patch({ label: event.target.value })} placeholder="Ví dụ: Sản phẩm nổi bật" /></div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label>Kiểu đường</Label><Select value={block.style} disabled={disabled} onValueChange={(style) => patch({ style: style as BioDividerBlockDto["style"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="solid">Liền</SelectItem><SelectItem value="dashed">Nét đứt</SelectItem><SelectItem value="dotted">Chấm</SelectItem></SelectContent></Select></div>
        <div className="grid gap-2"><Label>Khoảng cách</Label><Select value={block.spacing} disabled={disabled} onValueChange={(spacing) => patch({ spacing: spacing as BioDividerBlockDto["spacing"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sm">Nhỏ</SelectItem><SelectItem value="md">Vừa</SelectItem><SelectItem value="lg">Lớn</SelectItem></SelectContent></Select></div>
      </div>
    </div>
  );
}
