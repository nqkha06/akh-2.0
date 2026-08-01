"use client";

import {
  KeyRound,
  Laptop,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAdminUserSessions,
  revokeAdminUserSession,
  revokeAdminUserSessions,
} from "@/features/admin-users/api/users.client";
import type { AdminUserSession } from "@/features/admin-users/types";

export function UserSessionsCard({
  userId,
  userName,
  isSelf,
}: {
  userId: number;
  userName: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [sessions, setSessions] = React.useState<AdminUserSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedSession, setSelectedSession] =
    React.useState<AdminUserSession | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);

  const loadSessions = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminUserSessions(userId);
      setSessions(response.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách phiên đăng nhập.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    let cancelled = false;
    getAdminUserSessions(userId)
      .then((response) => {
        if (!cancelled) setSessions(response.items);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải danh sách phiên đăng nhập.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function revokeSelectedSession() {
    if (!selectedSession) return;
    setRevoking(true);
    try {
      const result = await revokeAdminUserSession(userId, selectedSession.id);
      toast.success(
        result.revoked
          ? "Đã đăng xuất phiên được chọn."
          : "Phiên này đã hết hiệu lực trước đó.",
      );
      setSelectedSession(null);
      await loadSessions();
      router.refresh();
    } catch (revokeError) {
      toast.error(
        revokeError instanceof Error
          ? revokeError.message
          : "Không thể đăng xuất phiên này.",
      );
    } finally {
      setRevoking(false);
    }
  }

  async function revokeAllSessions() {
    setRevoking(true);
    try {
      const result = await revokeAdminUserSessions(userId);
      toast.success(`Đã đăng xuất ${result.revokedSessions} phiên.`);
      setRevokeAllOpen(false);
      await loadSessions();
      router.refresh();
    } catch (revokeError) {
      toast.error(
        revokeError instanceof Error
          ? revokeError.message
          : "Không thể đăng xuất tất cả phiên.",
      );
    } finally {
      setRevoking(false);
    }
  }

  const activeSessions = sessions.filter(
    (session) => session.status === "active",
  );
  const inactiveSessions = sessions.filter(
    (session) => session.status !== "active",
  );

  return (
    <>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Phiên đăng nhập</CardTitle>
              {!loading ? (
                <Badge variant="secondary">{activeSessions.length} hoạt động</Badge>
              ) : null}
            </div>
            <CardDescription>
              Theo dõi tối đa 50 phiên gần nhất và thu hồi quyền truy cập khi cần.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSessions()}
              disabled={loading || revoking}
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} />
              Làm mới
            </Button>
            {!isSelf && activeSessions.length > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRevokeAllOpen(true)}
                disabled={revoking}
              >
                <LogOut /> Đăng xuất tất cả
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadSessions()}>
                Thử lại
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <KeyRound className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Người dùng chưa có phiên đăng nhập nào.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Đang hoạt động ({activeSessions.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  Lịch sử ({inactiveSessions.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <SessionList
                  sessions={activeSessions}
                  emptyText="Không có phiên nào đang hoạt động."
                  disabled={revoking}
                  onRevoke={setSelectedSession}
                />
              </TabsContent>
              <TabsContent value="history">
                <SessionList
                  sessions={inactiveSessions}
                  emptyText="Chưa có phiên hết hạn hoặc đã thu hồi."
                  disabled={revoking}
                  onRevoke={setSelectedSession}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(selectedSession)}
        onOpenChange={(open) => !open && !revoking && setSelectedSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất phiên này?</AlertDialogTitle>
            <AlertDialogDescription>
              Thiết bị {selectedSession ? describeUserAgent(selectedSession.userAgent) : "đã chọn"}{" "}
              sẽ phải đăng nhập lại để tiếp tục sử dụng tài khoản {userName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                void revokeSelectedSession();
              }}
            >
              {revoking ? <LoaderCircle className="animate-spin" /> : <LogOut />}
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revokeAllOpen}
        onOpenChange={(open) => !revoking && setRevokeAllOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất tất cả thiết bị?</AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả {activeSessions.length} phiên của {userName} sẽ bị thu hồi
              và người dùng phải đăng nhập lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                void revokeAllSessions();
              }}
            >
              {revoking ? <LoaderCircle className="animate-spin" /> : <LogOut />}
              Đăng xuất tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SessionList({
  sessions,
  emptyText,
  disabled,
  onRevoke,
}: {
  sessions: AdminUserSession[];
  emptyText: string;
  disabled: boolean;
  onRevoke: (session: AdminUserSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  const content = (
    <div className="divide-y rounded-lg border">
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          disabled={disabled}
          onRevoke={() => onRevoke(session)}
        />
      ))}
    </div>
  );

  return sessions.length > 5 ? (
    <ScrollArea className="h-[32rem] pe-3">{content}</ScrollArea>
  ) : (
    content
  );
}

function SessionRow({
  session,
  disabled,
  onRevoke,
}: {
  session: AdminUserSession;
  disabled: boolean;
  onRevoke: () => void;
}) {
  const active = session.status === "active";

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <SessionDeviceIcon userAgent={session.userAgent} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sm">
              {describeUserAgent(session.userAgent)}
            </p>
            {session.isCurrent ? <Badge variant="outline">Phiên hiện tại</Badge> : null}
            <SessionStatusBadge status={session.status} />
            <Badge variant="secondary">
              {session.authMethod === "google" ? "Google" : "Mật khẩu"}
            </Badge>
          </div>
          <p className="break-all text-xs text-muted-foreground" title={session.userAgent || undefined}>
            IP {session.ipAddress || "không xác định"} · Hoạt động gần nhất {formatTimestamp(session.lastActiveAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            Đăng nhập {formatTimestamp(session.createdAt)} · Hết hạn {formatTimestamp(session.expiresAt)}
          </p>
        </div>
      </div>
      {active ? (
        <Button
          variant="outline"
          size="sm"
          className="self-end md:self-auto"
          onClick={onRevoke}
          disabled={disabled || session.isCurrent}
          title={session.isCurrent ? "Không thể thu hồi phiên đang sử dụng" : undefined}
        >
          <LogOut /> Đăng xuất
        </Button>
      ) : null}
    </div>
  );
}

function SessionStatusBadge({ status }: { status: AdminUserSession["status"] }) {
  if (status === "active") return <Badge>Đang hoạt động</Badge>;
  if (status === "revoked") return <Badge variant="destructive">Đã thu hồi</Badge>;
  return <Badge variant="outline">Đã hết hạn</Badge>;
}

function describeUserAgent(userAgent: string | null) {
  if (!userAgent) return "Thiết bị không xác định";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Trình duyệt khác";
  const platform = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(userAgent)
            ? "macOS"
            : /Linux/.test(userAgent)
              ? "Linux"
              : "thiết bị không xác định";
  return `${browser} trên ${platform}`;
}

function SessionDeviceIcon({ userAgent }: { userAgent: string | null }) {
  const className = "size-5 text-muted-foreground";
  if (userAgent && /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) {
    return <Tablet className={className} />;
  }
  if (userAgent && /Mobile|iPhone|Android/i.test(userAgent)) {
    return <Smartphone className={className} />;
  }
  return <Laptop className={className} />;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
