import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";

import type { CreatePaymentMethodDto } from "./dto/create-payment-method.dto";
import type { PaymentMethodFieldDto } from "./dto/payment-method-field.dto";
import {
  parsePaymentMethodFields,
  paymentMethodFieldSignature,
} from "./payment-method.mapper";

export function assertPaymentTranslationsCompatible(
  translations: CreatePaymentMethodDto["translations"],
) {
  const signatures = translations.map((translation) => {
    const keys = translation.fields.map(({ key }) => key);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException(
        `Field key trong bản dịch "${translation.locale}" không được trùng nhau.`,
      );
    }
    for (const field of translation.fields) {
      if (field.type === "select") {
        const options = field.options ?? [];
        const values = options.map(({ value }) => value.trim());
        if (
          options.length === 0 ||
          values.some((value) => !value) ||
          options.some(({ label }) => !label.trim()) ||
          new Set(values).size !== values.length
        ) {
          throw new BadRequestException(
            `Field select "${field.key}" trong bản dịch "${translation.locale}" phải có danh sách lựa chọn hợp lệ và không trùng giá trị.`,
          );
        }
      } else if (field.options?.length) {
        throw new BadRequestException(
          `Chỉ field select mới được cấu hình danh sách lựa chọn.`,
        );
      }
    }
    return paymentMethodFieldSignature(translation.fields);
  });
  if (new Set(signatures).size !== 1) {
    throw new BadRequestException(
      "Hai bản dịch phải có cùng field key, kiểu dữ liệu và trạng thái bắt buộc.",
    );
  }
}

export function assertPaymentFieldSchemaCanChange(
  userMethodCount: number,
  currentFields: PaymentMethodFieldDto[],
  nextFields: PaymentMethodFieldDto[],
) {
  if (
    userMethodCount > 0 &&
    paymentMethodFieldSignature(nextFields) !==
      paymentMethodFieldSignature(currentFields)
  ) {
    throw new ConflictException(
      "Không thể đổi key, kiểu, field bắt buộc hoặc giá trị của lựa chọn khi phương thức đã được member sử dụng. Bạn vẫn có thể sửa tên và nội dung hiển thị.",
    );
  }
}

export function validatePaymentMethodDetails(
  method: {
    translations: Array<{ locale: string; fieldsJson: string | null }>;
  },
  rawDetails: Record<string, unknown>,
) {
  const translation =
    method.translations.find(({ locale }) => locale === "vi") ??
    method.translations.find(({ locale }) => locale === "en") ??
    method.translations[0];
  const fields = parsePaymentMethodFields(translation?.fieldsJson);
  const allowedKeys = new Set(fields.map(({ key }) => key));

  for (const key of Object.keys(rawDetails)) {
    if (!allowedKeys.has(key)) {
      throw new BadRequestException(`Field "${key}" không được hỗ trợ.`);
    }
  }

  const details: Record<string, string> = {};
  for (const field of fields) {
    const rawValue = rawDetails[field.key];
    if (rawValue !== undefined && typeof rawValue !== "string") {
      throw new BadRequestException(
        `Giá trị của "${field.label}" phải là chuỗi.`,
      );
    }
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (field.required && !value) {
      throw new BadRequestException(`"${field.label}" là thông tin bắt buộc.`);
    }
    if (value.length > 500) {
      throw new BadRequestException(
        `"${field.label}" không được vượt quá 500 ký tự.`,
      );
    }
    if (
      value &&
      field.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      throw new BadRequestException(`"${field.label}" không hợp lệ.`);
    }
    if (value && field.type === "number" && !/^-?\d+(?:\.\d+)?$/.test(value)) {
      throw new BadRequestException(`"${field.label}" phải là một số.`);
    }
    if (
      value &&
      field.type === "select" &&
      !field.options?.some((option) => option.value === value)
    ) {
      throw new BadRequestException(`"${field.label}" không hợp lệ.`);
    }
    if (value) details[field.key] = value;
  }
  return details;
}
