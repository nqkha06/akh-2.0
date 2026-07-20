import { z } from "zod";

import { userStatuses } from "../types.ts";

const passwordSchema = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
  .max(128, "Mật khẩu tối đa 128 ký tự.")
  .regex(/[a-z]/, "Mật khẩu phải có chữ thường.")
  .regex(/[A-Z]/, "Mật khẩu phải có chữ hoa.")
  .regex(/\d/, "Mật khẩu phải có chữ số.");

const sharedFields = {
  name: z
    .string()
    .trim()
    .min(2, "Họ tên cần ít nhất 2 ký tự.")
    .max(100, "Họ tên tối đa 100 ký tự."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ.")
    .max(254, "Email tối đa 254 ký tự."),
  avatar: z
    .string()
    .trim()
    .max(2048, "Avatar URL quá dài.")
    .refine((value) => !value || URL.canParse(value), "Avatar URL không hợp lệ."),
  roles: z.array(z.string()).min(1, "Người dùng cần ít nhất một role."),
  permissions: z.array(z.string()),
  status: z.enum(userStatuses),
  emailVerified: z.boolean(),
};

export const userEditorFormSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("create"),
      ...sharedFields,
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: "Mật khẩu xác nhận không khớp.",
    }),
  z.object({
    mode: z.literal("edit"),
    ...sharedFields,
    password: z.literal(""),
    confirmPassword: z.literal(""),
  }),
]);

export type UserEditorFormValues = z.infer<typeof userEditorFormSchema>;
