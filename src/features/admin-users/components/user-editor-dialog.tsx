"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAdminUser,
  updateAdminUser,
} from "@/features/admin-users/api/users.client";
import type {
  AdminUser,
  AdminUserPayload,
} from "@/features/admin-users/types";

export function UserEditorDialog({
  open,
  user,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [values, setValues] = React.useState<AdminUserPayload>(() =>
    initialValues(user),
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim() || !values.email.trim()) {
      setError("Tên và email là bắt buộc.");
      return;
    }
    if (!user && !values.password) {
      setError("Mật khẩu là bắt buộc khi tạo tài khoản.");
      return;
    }
    if (
      values.password &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(values.password)
    ) {
      setError(
        "Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường và chữ số.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (user) {
        await updateAdminUser(user.id, values);
        toast.success("Đã cập nhật người dùng.");
      } else {
        await createAdminUser({ ...values, password: values.password || "" });
        toast.success("Đã tạo người dùng.");
      }
      onOpenChange(false);
      onSuccess();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu người dùng.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {user ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Thay đổi password, role hoặc trạng thái sẽ đăng xuất toàn bộ phiên của người dùng."
              : "Tạo tài khoản mới với role và trạng thái ban đầu."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Họ và tên" htmlFor="admin-user-name">
              <Input
                id="admin-user-name"
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                autoComplete="name"
              />
            </FormField>
            <FormField label="Email" htmlFor="admin-user-email">
              <Input
                id="admin-user-email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                autoComplete="email"
              />
            </FormField>
          </div>
          <FormField
            label={user ? "Mật khẩu mới (không bắt buộc)" : "Mật khẩu"}
            htmlFor="admin-user-password"
          >
            <Input
              id="admin-user-password"
              type="password"
              value={values.password || ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự, hoa, thường và số"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role" htmlFor="admin-user-role">
              <Select
                value={values.role}
                onValueChange={(role: "admin" | "member") =>
                  setValues((current) => ({ ...current, role }))
                }
              >
                <SelectTrigger id="admin-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Trạng thái" htmlFor="admin-user-status">
              <Select
                value={values.status}
                onValueChange={(status: AdminUserPayload["status"]) =>
                  setValues((current) => ({ ...current, status }))
                }
              >
                <SelectTrigger id="admin-user-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="locked">Đã khóa</SelectItem>
                  <SelectItem value="suspended">Tạm ngưng</SelectItem>
                  <SelectItem value="disabled">Vô hiệu hóa</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu người dùng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function initialValues(user: AdminUser | null): AdminUserPayload {
  return {
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role === "admin" ? "admin" : "member",
    status: normalizeStatus(user?.status),
  };
}

function normalizeStatus(status?: string): AdminUserPayload["status"] {
  return ["active", "inactive", "locked", "suspended", "disabled"].includes(
    status || "",
  )
    ? (status as AdminUserPayload["status"])
    : "active";
}
