import { z } from "zod";

export const emptyTiptapDocument: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const pageFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề là bắt buộc.")
    .max(200, "Tiêu đề tối đa 200 ký tự."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug là bắt buộc.")
    .max(180, "Slug tối đa 180 ký tự.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chỉ gồm chữ thường, số và dấu gạch ngang.",
    ),
  excerpt: z.string().max(500, "Mô tả ngắn tối đa 500 ký tự."),
  contentJson: z.custom<Record<string, unknown>>(
    (value) =>
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).type === "doc",
    "Nội dung không hợp lệ.",
  ),
  contentHtml: z.string(),
  featuredImageId: z.string().nullable(),
  seoTitle: z.string().max(200, "SEO title tối đa 200 ký tự."),
  seoDescription: z
    .string()
    .max(320, "Meta description tối đa 320 ký tự."),
  seoKeywords: z.string().max(500, "Keywords tối đa 500 ký tự."),
  canonicalUrl: z
    .string()
    .refine(
      (value) => !value || URL.canParse(value),
      "Canonical URL không hợp lệ.",
    ),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  sortOrder: z
    .number()
    .int("Thứ tự phải là số nguyên.")
    .min(-1_000_000)
    .max(1_000_000),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;

export function slugifyPageTitle(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[đĐ]/g, (character) => (character === "đ" ? "d" : "D"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}
