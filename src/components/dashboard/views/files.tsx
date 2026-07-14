"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

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
import { FileUploadDialog } from "@/components/dashboard/files/file-upload-dialog";
import { FilesBulkActions } from "@/components/dashboard/files/files-bulk-actions";
import { FilesHeader } from "@/components/dashboard/files/files-header";
import { FilesEmptyState, FilesErrorState, FilesNoResults, FilesSkeleton } from "@/components/dashboard/files/files-states";
import { FilesTable } from "@/components/dashboard/files/files-table";
import { FilesToolbar } from "@/components/dashboard/files/files-toolbar";
import { StorageUsage } from "@/components/dashboard/files/storage-usage";
import { useFilesController } from "@/components/dashboard/files/use-files-controller";

export function FilesView() {
  const controller = useFilesController();
  const [infoVisible, setInfoVisible] = useState(true);
  const privateFiles = controller.files.filter((file) => !file.isPublic).length;
  const hasCriteria = Boolean(controller.query) || controller.filters.type !== "all" || controller.filters.status !== "all" || controller.sort !== "newest";
  const initialLoading = controller.loading && controller.files.length === 0 && !controller.error;

  return (
    <section className="mx-auto max-w-[1320px] space-y-6 [--primary:oklch(0.56_0.2_257)] [--ring:var(--primary)] [--files-success:oklch(0.53_0.15_154)] dark:[--primary:oklch(0.7_0.15_257)] dark:[--files-success:oklch(0.72_0.16_154)]">
      <FilesHeader onUpload={() => controller.setUploadOpen(true)} />
      {initialLoading ? <FilesSkeleton /> : <>
        <StorageUsage used={controller.totalSize} privateFiles={privateFiles} />
        {infoVisible ? <Alert className="grid-cols-[1rem_1fr_auto] items-center bg-muted/20"><Info /><AlertTitle className="col-start-2 line-clamp-none leading-5">Các file tải lên có thể được dùng làm destination sau khi người xem hoàn tất action.</AlertTitle><AlertDescription className="col-start-2">File công khai có thể được truy cập trực tiếp bằng URL.</AlertDescription><Button variant="ghost" size="icon-sm" className="col-start-3 row-start-1 row-span-2" onClick={() => setInfoVisible(false)} aria-label="Đóng thông báo"><X /></Button></Alert> : null}
        <FilesToolbar query={controller.query} filters={controller.filters} sort={controller.sort} loading={controller.loading} onQueryChange={controller.setQuery} onTypeChange={controller.setType} onStatusChange={controller.setStatus} onSortChange={controller.setSort} onClear={controller.clearCriteria} onRefresh={controller.refresh} />
        <FilesBulkActions count={controller.selectedFiles.length} busy={controller.busy} onDownload={controller.downloadSelected} onVisibilityChange={controller.updateSelectedVisibility} onDelete={() => controller.setBulkDeleteOpen(true)} onClear={controller.clearSelection} />
        {controller.error ? <FilesErrorState message={controller.error} onRetry={controller.refresh} /> : controller.loading && controller.files.length === 0 ? <FilesSkeleton /> : controller.files.length === 0 && !hasCriteria ? <FilesEmptyState onUpload={() => controller.setUploadOpen(true)} /> : controller.visibleFiles.length === 0 ? <FilesNoResults onClear={controller.clearCriteria} onUpload={() => controller.setUploadOpen(true)} /> : <FilesTable files={controller.visibleFiles} uploads={controller.uploadQueue} selectedIds={controller.selectedIds} page={controller.page} pageCount={controller.pageCount} total={controller.filteredTotal} onPageChange={controller.setPage} onSelect={controller.selectFile} onSelectPage={controller.selectPage} onPreview={(file) => controller.openPreview(file)} onCopyUrl={controller.copyUrl} onCopyAlias={controller.copyAlias} onUseDestination={controller.useDestination} onRename={(file) => controller.openPreview(file, "rename")} onDelete={controller.setFilePendingDelete} onCancelUpload={controller.cancelUpload} />}
      </>}

      <FileUploadDialog open={controller.uploadOpen} queue={controller.uploadQueue} onOpenChange={controller.setUploadOpen} onFilesSelected={controller.addFiles} onRetry={controller.retryUpload} onCancel={controller.cancelUpload} onRemove={controller.removeUpload} />
      <FilePreviewSheet file={controller.previewFile} open={controller.previewOpen} mode={controller.previewMode} saving={controller.busy} onOpenChange={controller.setPreviewOpen} onCopyUrl={controller.copyUrl} onUseDestination={controller.useDestination} onRename={controller.renameFile} onToggleVisibility={controller.toggleVisibility} onDelete={controller.setFilePendingDelete} />

      <AlertDialog open={Boolean(controller.filePendingDelete)} onOpenChange={(open) => !open && controller.setFilePendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa file?</AlertDialogTitle><AlertDialogDescription>File “{controller.filePendingDelete?.name}” sẽ bị xóa khỏi danh sách. API hiện chưa cung cấp dữ liệu nơi đang sử dụng, vì vậy hãy kiểm tra các social link liên quan trước khi tiếp tục.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void controller.confirmDelete()}>Xóa file</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={controller.bulkDeleteOpen} onOpenChange={controller.setBulkDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa {controller.selectedFiles.length} file?</AlertDialogTitle><AlertDialogDescription>Các file đã chọn sẽ bị xóa khỏi thư viện. API hiện chưa cung cấp dữ liệu nơi sử dụng để kiểm tra tự động.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void controller.confirmBulkDelete()}>Xóa các file</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
