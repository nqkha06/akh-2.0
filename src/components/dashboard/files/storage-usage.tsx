import { HardDrive, Info } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { formatBytes, STORAGE_LIMIT } from "./file-utils";

export function StorageUsage({ used, privateFiles }: { used: number; privateFiles: number }) {
  const percent = Math.min((used / STORAGE_LIMIT) * 100, 100);

  return (
    <TooltipProvider>
      <section className="grid gap-4 border-y border-border py-4 sm:grid-cols-[1fr_minmax(260px,380px)] sm:items-center" aria-label="Dung lượng lưu trữ">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <span className="font-medium">{formatBytes(used)} / 1 GB đã sử dụng</span>
              <span className="text-muted-foreground">· {privateFiles} file riêng tư</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-sm text-muted-foreground hover:text-foreground" aria-label="Giải thích giới hạn lưu trữ"><Info className="size-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">Dung lượng tính trên tất cả file đang hoạt động. Giới hạn hiện tại là 1 GB.</TooltipContent>
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
