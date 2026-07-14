import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FilesHeader({ onUpload }: { onUpload: () => void }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]">Files</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          Quản lý các tệp được sử dụng cho social links, link-in-bio và nội dung mở khóa.
        </p>
      </div>
      <Button className="h-11 w-full shrink-0 sm:w-auto" onClick={onUpload}>
        <Upload aria-hidden="true" />Tải file lên
      </Button>
    </header>
  );
}

