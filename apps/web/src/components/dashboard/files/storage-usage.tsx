import { HardDrive, Info } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { formatBytes } from "./file-utils";

export function StorageUsage({ used, reserved, limit }: { used: number; reserved: number; limit: number }) {
  const percent = limit > 0 ? Math.min(((used + reserved) / limit) * 100, 100) : 0;

  return (
    <TooltipProvider>
      <section className="grid gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:grid-cols-[1fr_minmax(260px,380px)] sm:items-center sm:px-5" aria-label="Dung lượng lưu trữ">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <span className="font-medium">{formatBytes(used)} / {formatBytes(limit)} đã sử dụng</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-sm text-muted-foreground hover:text-foreground" aria-label="Giải thích giới hạn lưu trữ"><Info className="size-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">Dung lượng đã đặt trước cho file đang upload: {formatBytes(reserved)}. File trong thùng rác vẫn chiếm dung lượng cho tới khi được xóa vĩnh viễn.</TooltipContent>
              </Tooltip>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{percent.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}% dung lượng đã được sử dụng</p>
          </div>
        </div>
        <Progress value={percent} className="h-1.5 bg-muted" aria-label={`${percent.toFixed(2)}% dung lượng đã sử dụng`} aria-valuenow={Math.round(percent)} />
      </section>
    </TooltipProvider>
  );
}
