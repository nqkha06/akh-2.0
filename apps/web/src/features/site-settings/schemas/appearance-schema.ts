import { z } from "zod";

import { socialPlatforms } from "../types.ts";

const optionalUrl = z.string().trim().refine(
  (value) => !value || URL.canParse(value),
  "URL không hợp lệ.",
);
const optionalHttpsUrl = z.string().trim().refine(
  (value) => !value || (URL.canParse(value) && new URL(value).protocol === "https:"),
  "URL phải hợp lệ và sử dụng HTTPS.",
);

export const appearanceSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "Tên website là bắt buộc.").max(120),
  siteShortName: z.string().trim().max(40),
  siteDescription: z.string().trim().max(320),
  siteTagline: z.string().trim().max(160),
  siteUrl: optionalUrl,
  logoLightId: z.string().nullable(),
  logoDarkId: z.string().nullable(),
  logoIconId: z.string().nullable(),
  faviconId: z.string().nullable(),
  defaultOgImageId: z.string().nullable(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(socialPlatforms),
        url: optionalHttpsUrl.refine(Boolean, "URL là bắt buộc."),
        isActive: z.boolean(),
        sortOrder: z.number().int().min(0).max(1000),
      }),
    )
    .max(10)
    .refine(
      (links) => new Set(links.map((link) => link.platform)).size === links.length,
      "Mỗi nền tảng chỉ được thêm một lần.",
    ),
  contactEmail: z.string().trim().refine(
    (value) => !value || z.email().safeParse(value).success,
    "Email liên hệ không hợp lệ.",
  ),
  supportEmail: z.string().trim().refine(
    (value) => !value || z.email().safeParse(value).success,
    "Email hỗ trợ không hợp lệ.",
  ),
  phone: z.string().trim().max(50),
  address: z.string().trim().max(500),
  workingHours: z.string().trim().max(200),
  mapUrl: optionalHttpsUrl,
});

export type AppearanceSettingsValues = z.infer<typeof appearanceSettingsSchema>;
