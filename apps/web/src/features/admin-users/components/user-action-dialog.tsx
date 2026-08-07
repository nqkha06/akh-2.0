"use client";

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
import {
  deleteAdminUsers,
  impersonateAdminUser,
  revokeAdminUserSessions,
} from "@/features/admin-users/api/users.client";
import type { AdminUserListItem } from "@/features/admin-users/types";

export type UserConfirmationAction =
  | { type: "delete"; users: AdminUserListItem[] }
  | { type: "revoke-sessions"; users: [AdminUserListItem] }
  | { type: "impersonate"; users: [AdminUserListItem] };

export function UserActionDialog({
  action,
  onOpenChange,
  onSuccess,
}: {
  action: UserConfirmationAction | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const content = action ? getContent(action) : null;

  async function confirm() {
    if (!action) return;
    setPending(true);
    try {
      if (action.type === "delete") {
        const result = await deleteAdminUsers(
          action.users.map((user) => user.id),
        );
        toast.success(`Đã xóa ${result.deleted} người dùng.`);
      } else if (action.type === "revoke-sessions") {
        const result = await revokeAdminUserSessions(action.users[0].id);
        toast.success(`Đã thu hồi ${result.revokedSessions} phiên đăng nhập.`);
      } else {
        await impersonateAdminUser(action.users[0].id);
        return;
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thực hiện thao tác.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={Boolean(action)}
      onOpenChange={(open) => !pending && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content?.title}</AlertDialogTitle>
          <AlertDialogDescription>{content?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant={action?.type === "delete" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? "Đang xử lý..." : content?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getContent(action: UserConfirmationAction) {
  if (action.type === "delete") {
    return {
      title: `Xóa ${action.users.length} người dùng?`,
      description:
        "Tài khoản đang sở hữu nội dung hoặc dữ liệu liên quan sẽ không thể xóa. Thao tác này không thể hoàn tác.",
      confirm: "Xóa người dùng",
    };
  }
  const user = action.users[0];
  if (action.type === "impersonate") {
    return {
      title: `Đăng nhập với tư cách ${user.name}?`,
      description:
        "Bạn sẽ tạm rời khu vực admin và thao tác trong tài khoản member này. Mọi hành động vẫn được ghi nhận là phiên impersonation và bạn có thể quay lại admin từ thanh cảnh báo.",
      confirm: "Tiếp tục đăng nhập",
    };
  }
  return {
    title: "Thu hồi toàn bộ phiên đăng nhập?",
    description: `${user.name} sẽ bị đăng xuất khỏi tất cả thiết bị và cần đăng nhập lại.`,
    confirm: "Thu hồi phiên",
  };
}
