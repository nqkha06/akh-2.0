"use client";

import {
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Database,
  FileText,
  Files,
  Globe2,
  HardDrive,
  Link2,
  LifeBuoy,
  Network,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
  WalletCards,
  Zap,
  type LucideIcon,
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
  const canRevokeSessions = permissions.includes("users.revoke-sessions");
  const canViewSocialLinks = permissions.includes("links.read");
  const canViewWithdrawals = permissions.includes("withdrawals.read");
  const isSelf = user.id === currentUserId;
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
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 w-fit text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/admin/users">
            <ArrowLeft /> Danh sách người dùng
          </Link>
        </Button>

        <AdminPageHeader
          title={user.name}
          description={user.email}
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: user.name },
          ]}
          leading={
            <Avatar className="size-12 rounded-xl border">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="rounded-xl">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          }
          meta={
            <>
              <UserStatusBadge status={user.status} />
              {isSelf ? <Badge variant="outline">Bạn</Badge> : null}
            </>
          }
          actions={
            <>
              {canViewSocialLinks ? (
                <Button variant="outline" asChild>
                  <Link href={`/admin/social-links?userId=${user.id}`}>
                    <Link2 /> Social Links
                  </Link>
                </Button>
              ) : null}
              {canViewWithdrawals ? (
                <Button variant="outline" asChild>
                  <Link href={`/admin/withdrawals?userId=${user.id}`}>
                    <CircleDollarSign /> Yêu cầu rút tiền
                  </Link>
                </Button>
              ) : null}
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            icon={WalletCards}
            label="Số dư"
            value={formatMoney(user.balance)}
            description={`${user.withdrawalsCount} yêu cầu rút tiền`}
          />
          <SummaryMetric
            icon={Award}
            label="Tier hiện tại"
            value={user.loyaltyTier?.name || "Chưa đạt Tier"}
            description={`${user.loyaltyCurrentValue.toLocaleString("vi-VN")} lượt xem hợp lệ / ${user.loyaltyWindowDays} ngày`}
          />
          <SummaryMetric
            icon={Zap}
            label="Cấp kiếm tiền"
            value={user.monetizationLevel?.name || "Chưa cấu hình"}
            description={
              user.usesDefaultMonetizationLevel
                ? "Đang dùng mặc định hệ thống"
                : "Được gán riêng cho người dùng"
            }
          />
          <SummaryMetric
            icon={HardDrive}
            label="Lưu trữ"
            value={formatBytes(user.storage.usedBytes)}
            description={
              user.storage.limitBytes
                ? `Giới hạn ${formatBytes(user.storage.limitBytes)}`
                : "Theo giới hạn mặc định hệ thống"
            }
          />
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hồ sơ tài khoản</CardTitle>
                <CardDescription>
                  Thông tin định danh và lịch sử cập nhật tài khoản.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-x-8 sm:grid-cols-2">
                <DetailRow label="ID người dùng" value={String(user.id)} />
                <DetailRow label="Họ và tên" value={user.name} />
                <DetailRow label="Email" value={user.email} />
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
                <CardTitle>Dữ liệu và hoạt động</CardTitle>
                <CardDescription>
                  Tổng quan các quan hệ nghiệp vụ thuộc sở hữu người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <RelationshipMetric
                  icon={Link2}
                  label="Social Links"
                  value={user.relationshipCounts.links}
                  href={
                    canViewSocialLinks
                      ? `/admin/social-links?userId=${user.id}`
                      : undefined
                  }
                />
                <RelationshipMetric
                  icon={Globe2}
                  label="Trang Link-in-bio"
                  value={user.relationshipCounts.bioPages}
                />
                <RelationshipMetric
                  icon={Files}
                  label="Tệp đã tải lên"
                  value={user.relationshipCounts.files}
                />
                <RelationshipMetric
                  icon={FileText}
                  label="Snippets"
                  value={user.relationshipCounts.snippets}
                />
                <RelationshipMetric
                  icon={CircleDollarSign}
                  label="Yêu cầu rút tiền"
                  value={user.relationshipCounts.withdrawals}
                  href={
                    canViewWithdrawals
                      ? `/admin/withdrawals?userId=${user.id}`
                      : undefined
                  }
                />
                <RelationshipMetric
                  icon={UserPlus}
                  label="Người được giới thiệu"
                  value={user.relationshipCounts.referrals}
                />
                <RelationshipMetric
                  icon={LifeBuoy}
                  label="Yêu cầu hỗ trợ"
                  value={user.relationshipCounts.supportTickets}
                />
                <RelationshipMetric
                  icon={Network}
                  label="Hoa hồng nhận được"
                  value={user.relationshipCounts.commissions}
                />
                <RelationshipMetric
                  icon={Database}
                  label="Tổng phiên đăng nhập"
                  value={user.relationshipCounts.sessions}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
                <CardDescription>
                  Thông tin nhạy cảm được che bớt; dữ liệu đầy đủ không hiển thị
                  trực tiếp trong Admin Users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.paymentMethods.length ? (
                  user.paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="rounded-lg border px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <CreditCard className="size-4 text-muted-foreground" />
                          {method.name}
                        </div>
                        <Badge variant="outline">
                          {formatPublicationStatus(method.status)}
                        </Badge>
                      </div>
                      {method.details.length ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {method.details.map((detail) => (
                            <div key={detail.key} className="text-sm">
                              <span className="text-muted-foreground">
                                {detail.label}: </span>
                              <span className="font-medium tabular-nums">
                                {detail.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Không có thông tin hiển thị.
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <CreditCard className="mx-auto size-5 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Người dùng chưa thêm phương thức thanh toán.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vai trò truy cập</CardTitle>
                <CardDescription>
                  Phạm vi truy cập được quản lý tập trung theo vai trò.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {user.roles.length ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        <Shield className="size-3" /> {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Chưa được gán vai trò.
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AccessSummary
                    label="Vai trò"
                    value={user.roles.length}
                  />
                  <AccessSummary
                    label="Quyền hiệu lực"
                    value={user.permissions.length}
                  />
                </div>
                {user.directPermissions.length ? (
                  <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Có {user.directPermissions.length} quyền ngoại lệ được gán
                    trực tiếp và được giữ nguyên ngoài form vai trò.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giới thiệu và đăng nhập</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <DetailRow
                  label="Mã giới thiệu"
                  value={user.referralCode || "Chưa có"}
                />
                <DetailRow
                  label="Được giới thiệu bởi"
                  value={user.referrer?.name || "Không có"}
                />
                <div className="py-3 last:pb-0">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Tài khoản liên kết
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.socialAccounts.length ? (
                      user.socialAccounts.map((account) => (
                        <Badge key={account.id} variant="outline">
                          {formatProvider(account.provider)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm">Không có</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </aside>
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
              <CardTitle className="text-destructive">
                Khu vực nguy hiểm
              </CardTitle>
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

function AccessSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-semibold text-lg tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RelationshipMetric({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-semibold text-lg tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </>
  );
  const className =
    "flex items-center gap-3 rounded-lg border p-3 transition-colors";
  return href ? (
    <Link href={href} className={`${className} hover:bg-muted/40`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
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

function formatMoney(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBytes(value: string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const amount = bytes / 1024 ** index;
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: amount >= 10 ? 0 : 1,
  }).format(amount)} ${units[index]}`;
}

function formatProvider(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function formatPublicationStatus(status: string) {
  if (status === "published") return "Đang hoạt động";
  if (status === "draft") return "Bản nháp";
  if (status === "archived") return "Đã lưu trữ";
  return status;
}
