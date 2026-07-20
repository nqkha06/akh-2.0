"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ManagedImagePicker } from "@/components/media/managed-image-picker";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  createAdminUser,
  updateAdminUser,
} from "@/features/admin-users/api/users.client";
import {
  userEditorFormSchema,
  type UserEditorFormValues,
} from "@/features/admin-users/schemas/user-schema";
import type {
  AdminUserDetail,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UsersAccessOptions,
} from "@/features/admin-users/types";
import { userStatusConfig } from "@/features/admin-users/user-status";

export function UserEditor({
  user,
  accessOptions,
}: {
  user: AdminUserDetail | null;
  accessOptions: UsersAccessOptions;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id || 0);
  const permissions = useAdminPermissions();
  const canManageRoles = permissions.includes("users.manage-roles");
  const canManageStatus = permissions.includes("users.manage-status");
  const canVerifyEmail = permissions.includes("users.verify-email");
  const isAdministrator = session?.user?.roles?.includes("admin") ?? false;
  const isSelf = Boolean(user && user.id === currentUserId);
  const [saving, setSaving] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const form = useForm<UserEditorFormValues>({
    resolver: zodResolver(userEditorFormSchema),
    defaultValues: getDefaultValues(user),
    mode: "onBlur",
  });
  const hasChanges = form.formState.isDirty;
  const assignableRoles = React.useMemo(
    () =>
      isAdministrator
        ? accessOptions.roles
        : accessOptions.roles.filter(
            (role) =>
              role.key !== "admin" &&
              (role.permissionKeys || []).every((permission) =>
                permissions.includes(permission),
              ),
          ),
    [accessOptions.roles, isAdministrator, permissions],
  );
  const assignablePermissions = React.useMemo(
    () =>
      isAdministrator
        ? accessOptions.permissions
        : accessOptions.permissions.filter((permission) =>
            permissions.includes(permission.key),
          ),
    [accessOptions.permissions, isAdministrator, permissions],
  );

  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    if (
      hasChanges &&
      !saving &&
      !window.confirm("Bạn có thay đổi chưa lưu. Vẫn rời khỏi trang?")
    ) {
      return;
    }
    router.push(user ? `/admin/users/${user.id}` : "/admin/users");
  }

  async function submit(values: UserEditorFormValues) {
    setSaving(true);
    try {
      if (values.mode === "create") {
        const payload: CreateAdminUserPayload = {
          name: values.name,
          email: values.email,
          avatar: values.avatar || undefined,
          password: values.password,
          roles: canManageRoles ? values.roles : ["member"],
          permissions: canManageRoles ? values.permissions : [],
          status: canManageStatus ? values.status : "active",
          emailVerified: canVerifyEmail && values.emailVerified,
        };
        const created = await createAdminUser(payload);
        toast.success("Đã tạo người dùng.");
        router.replace(`/admin/users/${created.id}`);
        router.refresh();
        return;
      }

      if (!user) return;
      const dirtyFields = form.formState.dirtyFields;
      const payload: UpdateAdminUserPayload = {
        name: values.name,
        email: values.email,
        avatar: values.avatar || null,
        ...(!isSelf &&
        canManageRoles &&
        (dirtyFields.roles || dirtyFields.permissions)
          ? {
              roles: values.roles,
              permissions: values.permissions,
            }
          : {}),
        ...(!isSelf && canManageStatus && dirtyFields.status
          ? { status: values.status }
          : {}),
      };
      const updated = await updateAdminUser(user.id, payload);
      form.reset(getDefaultValues(updated));
      toast.success("Đã cập nhật người dùng.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu người dùng.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-6"
        >
          <AdminPageHeader
            title={user ? `Chỉnh sửa ${user.name}` : "Tạo User"}
            description="Quản lý thông tin tài khoản, trạng thái và phạm vi truy cập."
            breadcrumbs={
              user
                ? [
                    { label: "Dashboard", href: "/admin" },
                    { label: "Users", href: "/admin/users" },
                    {
                      label: user.name,
                      href: `/admin/users/${user.id}`,
                    },
                    { label: "Chỉnh sửa" },
                  ]
                : undefined
            }
            leading={
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Quay lại"
                onClick={leaveEditor}
              >
                <ArrowLeft />
              </Button>
            }
            actions={
              <>
                <Button type="button" variant="outline" onClick={leaveEditor}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saving || (Boolean(user) && !hasChanges)}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  {user ? "Lưu thay đổi" : "Tạo User"}
                </Button>
              </>
            }
          />

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin tài khoản</CardTitle>
                  <CardDescription>
                    Thông tin định danh được phép hiển thị trong khu vực quản
                    trị.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoFocus={!user}
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" autoComplete="email" />
                        </FormControl>
                        <FormDescription>
                          Đổi email sẽ đặt lại trạng thái xác minh.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Avatar URL</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://..."
                              inputMode="url"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImagePickerOpen(true)}
                          >
                            <ImageIcon /> Media Manager
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {!user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Mật khẩu ban đầu</CardTitle>
                    <CardDescription>
                      Mật khẩu chỉ được gửi tới Backend khi tạo tài khoản và
                      không bao giờ được trả lại Frontend.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-5 sm:grid-cols-2">
                    <PasswordField
                      form={form}
                      name="password"
                      label="Mật khẩu"
                      visible={showPassword}
                      onToggle={() => setShowPassword((value) => !value)}
                    />
                    <PasswordField
                      form={form}
                      name="confirmPassword"
                      label="Xác nhận mật khẩu"
                      visible={showPassword}
                      onToggle={() => setShowPassword((value) => !value)}
                    />
                  </CardContent>
                </Card>
              ) : null}

              {canManageRoles ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Role và quyền trực tiếp</CardTitle>
                    <CardDescription>
                      Role cung cấp quyền mặc định; quyền trực tiếp chỉ dùng cho
                      ngoại lệ. Không thể tự thay đổi quyền của chính mình.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="roles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roles</FormLabel>
                          <div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                            {assignableRoles.map((role) => (
                              <label
                                key={role.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={field.value.includes(role.key)}
                                  disabled={isSelf}
                                  onCheckedChange={(checked) =>
                                    field.onChange(
                                      toggleValue(
                                        field.value,
                                        role.key,
                                        checked === true,
                                      ),
                                    )
                                  }
                                />
                                {role.key === "admin" ? (
                                  <Shield className="size-4 text-primary" />
                                ) : (
                                  <UserRound className="size-4 text-muted-foreground" />
                                )}
                                <span>{role.name}</span>
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="permissions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quyền trực tiếp</FormLabel>
                          <div className="grid gap-5 rounded-lg border p-4 md:grid-cols-2">
                            {groupPermissions(assignablePermissions).map(
                              ([group, groupItems]) => (
                                <div key={group} className="space-y-2">
                                  <p className="font-medium text-sm capitalize">
                                    {group}
                                  </p>
                                  {groupItems.map((permission) => (
                                    <label
                                      key={permission.id}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <Checkbox
                                        className="mt-0.5"
                                        checked={field.value.includes(
                                          permission.key,
                                        )}
                                        disabled={isSelf}
                                        onCheckedChange={(checked) =>
                                          field.onChange(
                                            toggleValue(
                                              field.value,
                                              permission.key,
                                              checked === true,
                                            ),
                                          )
                                        }
                                      />
                                      <span>
                                        {permission.name}
                                        <span className="block font-mono text-[11px] text-muted-foreground">
                                          {permission.key}
                                        </span>
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              ),
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái</CardTitle>
                  <CardDescription>
                    Trạng thái khác Active sẽ chặn đăng nhập và thu hồi các
                    session hiện tại.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value}
                          disabled={!canManageStatus || isSelf}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(userStatusConfig).map(
                              ([value, config]) => (
                                <SelectItem key={value} value={value}>
                                  {config.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {userStatusConfig[field.value].description}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Xác minh email</CardTitle>
                  <CardDescription>
                    Chỉ đánh dấu thủ công khi đã kiểm tra quyền sở hữu email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="emailVerified"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Đã xác minh</FormLabel>
                          {user ? (
                            <FormDescription>
                              Dùng action tại trang chi tiết để thay đổi.
                            </FormDescription>
                          ) : null}
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            disabled={Boolean(user) || !canVerifyEmail}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <MetadataRow label="User ID" value={String(user.id)} />
                    <MetadataRow
                      label="Ngày tạo"
                      value={formatTimestamp(user.createdAt)}
                    />
                    <MetadataRow
                      label="Cập nhật"
                      value={formatTimestamp(user.updatedAt)}
                    />
                    <MetadataRow
                      label="Phiên hoạt động"
                      value={String(user.activeSessionsCount)}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        </form>
      </Form>

      <ManagedImagePicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={(file) =>
          form.setValue("avatar", file.downloadUrl, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        title="Chọn avatar"
      />
    </>
  );
}

function PasswordField({
  form,
  name,
  label,
  visible,
  onToggle,
}: {
  form: ReturnType<typeof useForm<UserEditorFormValues>>;
  name: "password" | "confirmPassword";
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={onToggle}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function getDefaultValues(user: AdminUserDetail | null): UserEditorFormValues {
  if (!user) {
    return {
      mode: "create",
      name: "",
      email: "",
      avatar: "",
      password: "",
      confirmPassword: "",
      roles: ["member"],
      permissions: [],
      status: "active",
      emailVerified: false,
    };
  }
  return {
    mode: "edit",
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    password: "",
    confirmPassword: "",
    roles: user.roles.map((role) => role.key),
    permissions: user.directPermissions,
    status: user.status,
    emailVerified: user.emailVerified,
  };
}

function toggleValue(values: string[], value: string, checked: boolean) {
  return checked
    ? [...new Set([...values, value])]
    : values.filter((item) => item !== value);
}

function groupPermissions(permissions: UsersAccessOptions["permissions"]) {
  return Object.entries(
    permissions.reduce<Record<string, typeof permissions>>(
      (groups, permission) => {
        (groups[permission.group] ||= []).push(permission);
        return groups;
      },
      {},
    ),
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
