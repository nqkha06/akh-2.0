"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Award,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Save,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
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
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { useAuthUser } from "@/features/auth/components/auth-user-provider";
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
import { cn } from "@/lib/utils";

export function UserEditor({
  user,
  accessOptions,
}: {
  user: AdminUserDetail | null;
  accessOptions: UsersAccessOptions;
}) {
  const router = useRouter();
  const currentUser = useAuthUser();
  const currentUserId = currentUser.id;
  const permissions = useAdminPermissions();
  const canManageRoles = permissions.includes("users.manage-roles");
  const canManageStatus = permissions.includes("users.manage-status");
  const isAdministrator = currentUser.roles.includes("admin");
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
          permissions: [],
          monetizationLevelId: values.monetizationLevelId,
          status: canManageStatus ? values.status : "active",
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
        dirtyFields.roles
          ? {
              roles: values.roles,
            }
          : {}),
        ...(!isSelf && canManageStatus && dirtyFields.status
          ? { status: values.status }
          : {}),
        ...(dirtyFields.monetizationLevelId
          ? { monetizationLevelId: values.monetizationLevelId }
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
            title={user ? `Chỉnh sửa ${user.name}` : "Tạo người dùng"}
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
                  {user ? "Lưu thay đổi" : "Tạo người dùng"}
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
                        <FormLabel>Ảnh đại diện</FormLabel>
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
                            <ImageIcon /> Chọn từ thư viện
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
                      Thiết lập mật khẩu an toàn cho lần đăng nhập đầu tiên.
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

              <Card>
                <CardHeader>
                  <CardTitle>Kiếm tiền và Tier</CardTitle>
                  <CardDescription>
                    Cấp kiếm tiền có thể gán riêng; Tier được hệ thống tự động
                    tính từ lượt xem hợp lệ trong 7 ngày gần nhất.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="monetizationLevelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cấp kiếm tiền</FormLabel>
                        <Select
                          value={
                            field.value === null
                              ? "system-default"
                              : String(field.value)
                          }
                          onValueChange={(value) =>
                            field.onChange(
                              value === "system-default"
                                ? null
                                : Number(value),
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="system-default">
                              Mặc định hệ thống
                            </SelectItem>
                            {accessOptions.monetizationLevels.map((level) => (
                              <SelectItem key={level.id} value={String(level.id)}>
                                {level.name}
                                {level.isDefault ? " · Mặc định" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Chọn “Mặc định hệ thống” để tự động dùng cấp mặc định
                          đang được xuất bản.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {user ? <Award className="size-4 text-primary" /> : <Zap className="size-4 text-primary" />}
                      {user ? "Tier hiện tại" : "Cách xác định Tier"}
                    </div>
                    {user ? (
                      <>
                        <p className="mt-3 text-lg font-semibold">
                          {user.loyaltyTier?.name || "Chưa đạt Tier"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {user.loyaltyCurrentValue.toLocaleString("vi-VN")} lượt
                          xem hợp lệ trong {user.loyaltyWindowDays} ngày.
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Tài khoản mới bắt đầu ở Tier tương ứng với dữ liệu thực
                        tế; quản trị viên không gán Tier thủ công.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {canManageRoles ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Vai trò truy cập</CardTitle>
                    <CardDescription>
                      Chọn vai trò phù hợp với trách nhiệm của người dùng. Quyền
                      chi tiết được quản lý tập trung trong Roles & Permissions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vai trò</FormLabel>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {assignableRoles.map((role) => (
                              <label
                                key={role.id}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                                  !isSelf && "cursor-pointer hover:bg-muted/40",
                                  field.value.includes(role.key) &&
                                    "border-primary/40 bg-primary/5",
                                  isSelf && "cursor-not-allowed opacity-60",
                                )}
                              >
                                <Checkbox
                                  className="mt-0.5"
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
                                <span className="min-w-0 space-y-1">
                                  <span className="flex flex-wrap items-center gap-2 font-medium text-sm">
                                    {role.name}
                                  </span>
                                  <span className="block text-xs leading-5 text-muted-foreground">
                                    {role.permissionKeys?.length || 0} quyền được
                                    cấp thông qua vai trò này.
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                          <FormDescription>
                            {isSelf
                              ? "Bạn không thể tự thay đổi vai trò của chính mình."
                              : "Mỗi người dùng cần có ít nhất một vai trò."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {user?.directPermissions.length ? (
                      <div className="rounded-lg border bg-muted/30 px-4 py-3">
                        <p className="font-medium text-sm">
                          Quyền ngoại lệ hiện có
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {user.directPermissions.length} quyền được gán trực
                          tiếp sẽ được giữ nguyên. Form này chỉ thay đổi vai trò
                          của người dùng.
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quản trị tài khoản</CardTitle>
                  <CardDescription>
                    Trạng thái đăng nhập và xác minh danh tính của người dùng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Trạng thái</p>
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
                  </div>

                </CardContent>
              </Card>

              {user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin hệ thống</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <MetadataRow label="ID người dùng" value={String(user.id)} />
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

      <AdminMediaPicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={(file) =>
          form.setValue("avatar", file.url, {
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
      monetizationLevelId: null,
      status: "active",
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
    monetizationLevelId: user.selectedMonetizationLevelId,
    status: user.status,
  };
}

function toggleValue(values: string[], value: string, checked: boolean) {
  return checked
    ? [...new Set([...values, value])]
    : values.filter((item) => item !== value);
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
