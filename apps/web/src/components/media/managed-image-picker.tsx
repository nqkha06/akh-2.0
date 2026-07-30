"use client";

import type { ChangeEvent } from "react";
import * as React from "react";

import { FilePickerCredenza } from "@/components/file-picker-credenza";
import {
  getFiles,
  type ManagedFileDto,
  uploadFile,
} from "@/lib/api-client";

export function ManagedImagePicker({
  open,
  onOpenChange,
  selectedFileId,
  onSelect,
  onSelectMany,
  multiple = false,
  maxFiles,
  acceptedMimeTypes,
  maxSize,
  title = "Chọn ảnh từ Media Manager",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFileId?: string | null;
  onSelect: (file: ManagedFileDto) => void;
  onSelectMany?: (files: ManagedFileDto[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  acceptedMimeTypes?: readonly string[];
  maxSize?: number;
  title?: string;
}) {
  const [files, setFiles] = React.useState<ManagedFileDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadFiles = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getFiles({
        sort: "date",
        direction: "desc",
        status: "active",
        limit: 100,
      });
      setFiles(response.items.filter((file) =>
        file.mimeType.startsWith("image/") &&
        (!acceptedMimeTypes || acceptedMimeTypes.includes(file.mimeType.toLowerCase())) &&
        (!maxSize || file.size <= maxSize),
      ));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải Media Manager.",
      );
    } finally {
      setLoading(false);
    }
  }, [acceptedMimeTypes, maxSize]);

  React.useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => void loadFiles(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadFiles, open]);

  async function handleFiles(selected: File[]) {
    const images = selected.filter((file) =>
      file.type.startsWith("image/") &&
      (!acceptedMimeTypes || acceptedMimeTypes.includes(file.type.toLowerCase())) &&
      (!maxSize || file.size <= maxSize),
    );
    if (!images.length) {
      setError("Ảnh không đúng định dạng hoặc vượt quá dung lượng cho phép.");
      return;
    }
    const selectedImages = multiple ? images : images.slice(0, 1);
    const uploadQueue = typeof maxFiles === "number"
      ? selectedImages.slice(0, maxFiles)
      : selectedImages;
    if (!uploadQueue.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await Promise.all(
        uploadQueue.map((image) => uploadFile(image, { purpose: "cover" })),
      );
      setFiles((current) => [...uploaded, ...current]);
      if (multiple && onSelectMany) {
        onSelectMany(uploaded);
      } else {
        onSelect(uploaded[0]);
      }
      onOpenChange(false);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể upload ảnh.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      void handleFiles(Array.from(event.target.files));
    }
    event.target.value = "";
  }

  return (
    <FilePickerCredenza
      open={open}
      onOpenChange={onOpenChange}
      files={files}
      isLoading={loading}
      error={error}
      mode="cover"
      selectedFileId={selectedFileId ?? undefined}
      title={title}
      description="Chỉ hiển thị ảnh còn hoạt động. Có thể upload ảnh mới ngay tại đây."
      labels={{
        action: "Chọn ảnh",
        close: "Đóng",
        empty: "Chưa có ảnh trong Media Manager.",
        loading: "Đang tải ảnh...",
        name: "Tên ảnh",
        select: "Dùng ảnh này",
        size: "Dung lượng",
        uploaded: "Ngày tải lên",
        search: "Tìm ảnh...",
        filesTab: "Media Manager",
        uploadsTab: "Upload",
        dragHint: "Kéo ảnh vào đây hoặc chọn từ máy",
        browseHint: "PNG, JPG, WEBP hoặc GIF; tối đa 10 MB.",
      }}
      upload={{
        accept: "image/*",
        isUploading: uploading,
        label: "Chọn ảnh",
        uploadingLabel: "Đang upload...",
        multiple,
        onChange: handleInput,
        onFiles: handleFiles,
      }}
      onSelect={(file) => {
        onSelect(file);
        onOpenChange(false);
      }}
    />
  );
}
