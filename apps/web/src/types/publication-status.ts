export const publicationStatuses = [
  "draft",
  "pending",
  "published",
] as const;

export type PublicationStatus = (typeof publicationStatuses)[number];

export const publicationStatusOptions: Array<{
  value: PublicationStatus;
  label: string;
  description: string;
}> = [
  {
    value: "draft",
    label: "Nháp",
    description:
      "Giữ nội dung ở chế độ riêng tư cho đến khi hoàn tất việc rà soát.",
  },
  {
    value: "pending",
    label: "Chờ xử lý",
    description:
      "Đánh dấu nội dung đang chờ kiểm tra hoặc hoàn tất cấu hình trước khi xuất bản.",
  },
  {
    value: "published",
    label: "Xuất bản",
    description:
      "Cho phép nội dung xuất hiện và được sử dụng ở khu vực public/member.",
  },
];

export function publicationStatusLabel(status: PublicationStatus) {
  return (
    publicationStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}
