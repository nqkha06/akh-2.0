"use client";

import { AdminMediaDialog, type AdminMediaDialogProps } from "./admin-media-dialog";

export type AdminMediaPickerProps = AdminMediaDialogProps;

export function AdminMediaPicker(props: AdminMediaPickerProps) {
  return <AdminMediaDialog {...props} />;
}
