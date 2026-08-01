"use client";

import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  MailCheck,
  Pencil,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateAdminUserStatus,
} from "@/features/admin-users/api/users.client";
import {
  UserActionDialog,
  type UserConfirmationAction,
} from "@/features/admin-users/components/user-action-dialog";
import { UserStatusBadge } from "@/features/admin-users/components/user-status-badge";
import { UserSessionsCard } from "@/features/admin-users/components/user-sessions-card";
import type { AdminUserDetail } from "@/features/admin-users/types";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { useAuthUser } from "@/features/auth/components/auth-user-provider";

export function UserDetails({ user }: { user: AdminUserDetail }) {
  const router = useRouter();
  const currentUserId = useAuthUser().id;
  const permissions = useAdminPermissions();
  const canUpdate = permissions.includes("users.update");
  const canDelete = permissions.includes("users.delete");
  const canManageStatus = permissions.includes("users.manage-status");
  const canVerifyEmail = permissions.includes("users.verify-email");
  const canRevokeSessions = permissions.includes("users.revoke-sessions");
  const isSelf = user.id === currentUserId;
  const showSecurityActions = canVerifyEmail && !user.emailVerified;
  const [action, setAction] = React.useState<UserConfirmationAction | null>(
    null,
  );
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  async function changeStatus() {
    setUpdatingStatus(true);
    try {
      await updateAdminUserStatus(
        user.id,
        user.status === "active" ? "inactive" : "active",
      );
      toast.success("Đã cập nhật trạng thái người dùng.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const deleting = action?.type === "delete";

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-6">
        <AdminPageHeader
          title={user.name}
          description={user.email}
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: user.name },
          ]}
          leading={
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" asChild>
                <Link href="/admin/users" aria-label="Quay lại danh sách">
                  <ArrowLeft />
                </Link>
              </Button>
              <Avatar className="size-12 rounded-xl border">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="rounded-xl">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          }
          meta={
            <>
              <UserStatusBadge status={user.status} />
              {isSelf ? <Badge variant="outline">Bạn</Badge> : null}
            </>
          }
          actions={
            <>
              {canManageStatus && !isSelf ? (
                <Button
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => void changeStatus()}
                >
                  {user.status === "active" ? <Ban /> : <CheckCircle2 />}
                  {user.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                </Button>
              ) : null}
              {canUpdate ? (
                <Button asChild>
                  <Link href={`/admin/users/${user.id}/edit`}>
                    <Pencil /> Chỉnh sửa
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>
                Dữ liệu định danh và trạng thái xác minh hiện tại.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <DetailRow label="User ID" value={String(user.id)} />
              <DetailRow label="Họ và tên" value={user.name} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow
                label="Xác minh email"
                value={
                  user.emailVerifiedAt
                    ? formatTimestamp(user.emailVerifiedAt)
                    : "Chưa xác minh"
                }
              />
              <DetailRow
                label="Ngày tạo"
                value={formatTimestamp(user.createdAt)}
              />
              <DetailRow
                label="Cập nhật"
                value={formatTimestamp(user.updatedAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quyền truy cập</CardTitle>
              <CardDescription>
                Role và quyền trực tiếp được lưu riêng; danh sách quyền hiệu lực
                là kết quả hợp nhất.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role.id} variant="outline">
                      <Shield className="size-3" /> {role.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Quyền trực tiếp
                </p>
                <PermissionList permissions={user.directPermissions} />
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Quyền hiệu lực
                </p>
                <PermissionList permissions={user.permissions} />
              </div>
            </CardContent>
          </Card>

          <Card className={!showSecurityActions ? "lg:col-span-2" : undefined}>
            <CardHeader>
              <CardTitle>Hoạt động tài khoản</CardTitle>
              <CardDescription>
                Tổng quan nội dung và số phiên đăng nhập còn hiệu lực.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <DetailRow
                label="Nội dung đang sở hữu"
                value={String(user.linksCount)}
              />
              <DetailRow
                label="Phiên đang hoạt động"
                value={String(user.activeSessionsCount)}
              />
            </CardContent>
          </Card>

          {showSecurityActions ? (
            <Card>
              <CardHeader>
                <CardTitle>Security actions</CardTitle>
                <CardDescription>
                  Các thao tác nhạy cảm luôn yêu cầu xác nhận.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setAction({ type: "verify-email", users: [user] })
                  }
                >
                  <MailCheck /> Xác minh email
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {canRevokeSessions ? (
          <UserSessionsCard
            userId={user.id}
            userName={user.name}
            isSelf={isSelf}
          />
        ) : null}

        {canDelete && !isSelf ? (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Chỉ xóa được tài khoản không còn sở hữu nội dung hoặc dữ liệu
                bị ràng buộc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setAction({ type: "delete", users: [user] })}
              >
                <Trash2 /> Xóa người dùng
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <UserActionDialog
        action={action}
        onOpenChange={() => setAction(null)}
        onSuccess={() => {
          if (deleting) {
            router.replace("/admin/users");
          } else {
            router.refresh();
          }
        }}
      />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right font-medium text-sm">{value}</span>
    </div>
  );
}

function PermissionList({ permissions }: { permissions: string[] }) {
  return permissions.length ? (
    <div className="flex flex-wrap gap-1.5">
      {permissions.map((permission) => (
        <Badge key={permission} variant="secondary" className="font-mono">
          {permission}
        </Badge>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">Không có.</p>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
