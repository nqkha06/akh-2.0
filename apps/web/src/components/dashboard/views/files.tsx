"use client";

import { useState } from "react";
import { Info, Upload, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FilePreviewSheet } from "@/components/dashboard/files/file-preview-sheet";
import { FileRenameCredenza } from "@/components/dashboard/files/file-rename-credenza";
import { FileUploadDialog } from "@/components/dashboard/files/file-upload-dialog";
import { FilesBulkActions } from "@/components/dashboard/files/files-bulk-actions";
import { FilesEmptyState, FilesErrorState, FilesNoResults, FilesSkeleton } from "@/components/dashboard/files/files-states";
import { FilesTable } from "@/components/dashboard/files/files-table";
import { FilesToolbar } from "@/components/dashboard/files/files-toolbar";
import { FilesUploadTray } from "@/components/dashboard/files/files-upload-tray";
import { StorageUsage } from "@/components/dashboard/files/storage-usage";
import { useFilesController } from "@/components/dashboard/files/use-files-controller";
import { PageHeader } from "@/components/dashboard/ui";

export function FilesView() {
  const controller = useFilesController();
  const [infoVisible, setInfoVisible] = useState(true);
  const hasCriteria = Boolean(controller.query) || controller.filters.type !== "all" || controller.filters.status !== "all" || controller.sort !== "newest";
  const initialLoading = controller.loading && controller.files.length === 0 && !controller.error;

  return (
    <section className="mx-auto max-w-[1320px] space-y-6 [--primary:oklch(0.56_0.2_257)] [--ring:var(--primary)] [--files-success:oklch(0.53_0.15_154)] dark:[--primary:oklch(0.7_0.15_257)] dark:[--files-success:oklch(0.72_0.16_154)]">
      <PageHeader
        title="Files"
        description="Quản lý các tệp được sử dụng cho social links, link-in-bio và nội dung mở khóa."
        action={
          <Button className="h-10 w-full shrink-0 sm:w-auto" onClick={() => controller.setUploadOpen(true)}>
            <Upload aria-hidden="true" />Tải file lên
          </Button>
        }
      />
      {initialLoading ? <FilesSkeleton /> : <>
        <StorageUsage used={controller.totalSize} reserved={controller.reservedSize} limit={controller.storageLimit} />
        {infoVisible ? <Alert className="grid-cols-[1rem_1fr_auto] items-center bg-muted/20"><Info /><AlertTitle className="col-start-2 line-clamp-none leading-5">File chỉ được phát hành qua Social Link sau khi người xem hoàn tất action.</AlertTitle><AlertDescription className="col-start-2">Member Files không cung cấp URL tải trực tiếp hoặc chế độ công khai.</AlertDescription><Button variant="ghost" size="icon-sm" className="col-start-3 row-start-1 row-span-2" onClick={() => setInfoVisible(false)} aria-label="Đóng thông báo"><X /></Button></Alert> : null}
        <div className="relative">
          <FilesToolbar query={controller.query} filters={controller.filters} sort={controller.sort} loading={controller.loading} onQueryChange={controller.setQuery} onTypeChange={controller.setType} onStatusChange={controller.setStatus} onSortChange={controller.setSort} onClear={controller.clearCriteria} onRefresh={controller.refresh} />
          <FilesBulkActions count={controller.selectedFiles.length} busy={controller.busy} onDelete={() => controller.setBulkDeleteOpen(true)} onClear={controller.clearSelection} />
        </div>
        {controller.error ? <FilesErrorState message={controller.error} onRetry={controller.refresh} /> : controller.loading && controller.files.length === 0 ? <FilesSkeleton /> : controller.files.length === 0 && !hasCriteria ? <FilesEmptyState onUpload={() => controller.setUploadOpen(true)} /> : controller.visibleFiles.length === 0 ? <FilesNoResults onClear={controller.clearCriteria} onUpload={() => controller.setUploadOpen(true)} /> : <FilesTable files={controller.visibleFiles} selectedIds={controller.selectedIds} page={controller.page} pageSize={controller.pageSize} total={controller.filteredTotal} onPageChange={controller.setPage} onPageSizeChange={controller.setPageSize} onSelect={controller.selectFile} onSelectPage={controller.selectPage} onPreview={controller.openPreview} onRename={controller.openRename} onDelete={controller.setFilePendingDelete} />}
      </>}

      <FileUploadDialog open={controller.uploadOpen} queue={controller.uploadQueue} onOpenChange={controller.setUploadOpen} onFilesSelected={controller.addFiles} onRetry={controller.retryUpload} onCancel={controller.cancelUpload} onRemove={controller.removeUpload} />
      <FilesUploadTray queue={controller.uploadQueue} hidden={controller.uploadOpen} onRetry={controller.retryUpload} onCancel={controller.cancelUpload} onRemove={controller.removeUpload} />
      <FilePreviewSheet file={controller.previewFile} open={controller.previewOpen} onOpenChange={controller.setPreviewOpen} />
      <FileRenameCredenza file={controller.filePendingRename} open={Boolean(controller.filePendingRename)} saving={controller.busy} onOpenChange={(open) => !open && controller.setFilePendingRename(null)} onRename={controller.renameFile} />

      <AlertDialog open={Boolean(controller.filePendingDelete)} onOpenChange={(open) => !open && controller.setFilePendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa file?</AlertDialogTitle><AlertDialogDescription>File “{controller.filePendingDelete?.name}” sẽ được chuyển vào thùng rác. Backend sẽ chặn nếu file vẫn đang được dùng làm destination.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void controller.confirmDelete()}>Xóa file</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={controller.bulkDeleteOpen} onOpenChange={controller.setBulkDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa {controller.selectedFiles.length} file?</AlertDialogTitle><AlertDialogDescription>Các file sẽ được chuyển vào thùng rác. Thao tác bị chặn nếu bất kỳ file nào còn được một link sử dụng.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void controller.confirmBulkDelete()}>Xóa các file</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
