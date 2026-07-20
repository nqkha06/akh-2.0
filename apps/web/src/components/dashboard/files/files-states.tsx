import { AlertCircle, FileQuestion, FileUp, FilterX, RotateCcw, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function FilesEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <section className="border-y border-border px-4 py-12 text-center sm:py-16">
      <div className="mx-auto grid size-11 place-items-center rounded-lg border border-border bg-muted/40 text-primary"><FileUp className="size-5" /></div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Chưa có file nào</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Tải file đầu tiên để sử dụng trong social links, link-in-bio hoặc nội dung mở khóa.</p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={onUpload}><Upload />Tải file lên</Button>
        <Button variant="outline" onClick={onUpload}>Xem định dạng được hỗ trợ</Button>
      </div>
      <ul className="mx-auto mt-7 flex max-w-2xl flex-col justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:gap-5">
        <li>Làm destination sau khi unlock</li><li>Hiển thị trên link-in-bio</li><li>Chia sẻ qua social link</li>
      </ul>
    </section>
  );
}

export function FilesNoResults({ onClear, onUpload }: { onClear: () => void; onUpload: () => void }) {
  return (
    <section className="border-y border-border px-4 py-12 text-center">
      <FileQuestion className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-4 text-base font-semibold text-foreground">Không tìm thấy file phù hợp</h2>
      <p className="mt-2 text-sm text-muted-foreground">Hãy thử thay đổi từ khóa hoặc xóa bộ lọc.</p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Button variant="outline" onClick={onClear}><FilterX />Xóa bộ lọc</Button><Button onClick={onUpload}><Upload />Tải file lên</Button></div>
    </section>
  );
}

export function FilesSkeleton() {
  return (
    <div aria-label="Đang tải danh sách file" aria-busy="true">
      <div className="border-y border-border py-4"><Skeleton className="h-4 w-72" /><Skeleton className="mt-3 h-1.5 w-full" /></div>
      <div className="flex gap-3 border-b border-border py-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-36" /><Skeleton className="h-10 w-36" /></div>
      <div>{Array.from({ length: 7 }).map((_, index) => <div key={index} className="flex h-16 items-center gap-4 border-b border-border px-3"><Skeleton className="size-4" /><Skeleton className="size-9" /><div className="flex-1"><Skeleton className="h-4 w-52" /><Skeleton className="mt-2 h-3 w-28" /></div><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-24" /></div>)}</div>
    </div>
  );
}

export function FilesErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="items-center">
      <AlertCircle /><AlertTitle>Không thể tải danh sách file.</AlertTitle>
      <AlertDescription><span>Vui lòng thử lại.</span>{message ? <span className="text-xs opacity-80">{message}</span> : null}<Button variant="outline" size="sm" className="mt-2 border-destructive/30 bg-background text-destructive" onClick={onRetry}><RotateCcw />Thử lại</Button></AlertDescription>
    </Alert>
  );
}
