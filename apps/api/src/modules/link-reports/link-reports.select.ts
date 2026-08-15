import { Prisma } from "@prisma/client";

export const LINK_REPORT_REVIEWER_SELECT = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

export const LINK_REPORT_ADMIN_INCLUDE = {
  reviewedBy: { select: LINK_REPORT_REVIEWER_SELECT },
} satisfies Prisma.LinkReportInclude;

export const LINK_REPORT_LIST_SELECT = {
  id: true,
  reference: true,
  email: true,
  reportedUrl: true,
  reason: true,
  status: true,
  resolutionNote: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: { select: LINK_REPORT_REVIEWER_SELECT },
} satisfies Prisma.LinkReportSelect;

export const LINK_REPORT_RECEIPT_SELECT = {
  reference: true,
  createdAt: true,
} satisfies Prisma.LinkReportSelect;
