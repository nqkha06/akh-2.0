import { BadRequestException, ForbiddenException } from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/auth.types";
import type { PageStatus } from "./pages.constants";

const PAGE_STATUS_TRANSITIONS = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
} as const satisfies Record<PageStatus, readonly PageStatus[]>;

export function assertPageCanPublish(
  user: Pick<AuthenticatedUser, "permissions">,
) {
  if (!user.permissions.includes("pages.publish")) {
    throw new ForbiddenException("Bạn không có quyền xuất bản trang.");
  }
}

export function assertPageStatusTransition(
  current: PageStatus,
  target: PageStatus,
) {
  if (current === target) return;
  if (!PAGE_STATUS_TRANSITIONS[current].some((status) => status === target)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái từ ${current} sang ${target}.`,
    );
  }
}
