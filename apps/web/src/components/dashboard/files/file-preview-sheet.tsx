"use client";

import Image from "next/image";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getFilePreviewUrl, type ManagedFileDto } from "@/lib/api-client";

import { FileTypeIcon, formatFileDate } from "./file-utils";

type FilePreviewSheetProps = {
  file: ManagedFileDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FilePreviewSheet({ file, ...props }: FilePreviewSheetProps) {
  if (!file) return null;
  return <FilePreviewSheetContent key={file.id} file={file} {...props} />;
}

function FilePreviewSheetContent({ file, open, onOpenChange }: Omit<FilePreviewSheetProps, "file"> & { file: ManagedFileDto }) {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 bg-card p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b border-border px-5 py-5 pr-12 sm:px-6"><SheetTitle className="truncate">{file.name}</SheetTitle><SheetDescription>Thông tin chi tiết và cách sử dụng file.</SheetDescription></SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5 sm:p-6">
            <div className="grid min-h-56 place-items-center overflow-hidden rounded-lg border border-border bg-muted/30">
              {isImage ? <Image src={getFilePreviewUrl(file)} alt={`Xem trước ${file.name}`} width={720} height={480} unoptimized className="max-h-72 w-full object-contain" /> : <div className="text-center text-muted-foreground"><FileTypeIcon file={file} className="mx-auto size-20 rounded-xl bg-background" iconClassName="size-12" /><p className="mt-3 text-xs">Định dạng này không hỗ trợ xem trước trực tiếp.</p></div>}
            </div>

            <div className="mt-5 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Tên file</p><p className="mt-1 break-words text-sm font-medium text-foreground">{file.name}</p></div>
            </div>

            <Separator className="my-5" />
            <div className="rounded-lg border border-border bg-card px-3">
              <dl className="divide-y divide-border text-sm">
                <Metadata label="Alias" value={`/${file.alias}`} />
                <Metadata label="MIME type" value={file.mimeType} />
                <Metadata label="Dung lượng" value={file.sizeLabel} />
                <Metadata label="Ngày tải lên" value={formatFileDate(file.createdAt, true)} />
                <Metadata label="Người tải lên" value="Bạn" />
                <Metadata label="Social links đang dùng" value={String(file.usageCount)} />
              </dl>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Metadata({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 first:pt-3 last:pb-3"><dt className="text-muted-foreground">{label}</dt><dd className={`text-right text-foreground ${breakAll ? "break-all" : "break-words"}`}>{value}</dd></div>;
}
