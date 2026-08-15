import type { PaymentMethodFieldDto } from "./dto/payment-method-field.dto";
import { paymentMethodFieldTypes } from "./dto/payment-method-field.dto";
import type {
  PaymentMethodCatalogRecord,
  PaymentMethodRecord,
  UserPaymentMethodRecord,
} from "./payment-method.select";

export function normalizePaymentMethodFields(fields: PaymentMethodFieldDto[]) {
  return fields.map((field) => ({
    key: field.key,
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    ...(field.placeholder?.trim()
      ? { placeholder: field.placeholder.trim() }
      : {}),
    ...(field.type === "select" && field.options
      ? {
          options: field.options.map((option) => ({
            value: option.value.trim(),
            label: option.label.trim(),
          })),
        }
      : {}),
  }));
}

export function paymentMethodFieldSignature(fields: PaymentMethodFieldDto[]) {
  return fields
    .map(({ key, type, required, options }) => {
      const optionValues =
        type === "select"
          ? (options ?? [])
              .map(({ value }) => value.trim())
              .sort()
              .join(",")
          : "";
      return optionValues
        ? `${key}:${type}:${required}:${optionValues}`
        : `${key}:${type}:${required}`;
    })
    .sort()
    .join("|");
}

export function parsePaymentMethodFields(
  value: string | null | undefined,
): PaymentMethodFieldDto[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((field) => {
      if (!isRecord(field)) return [];
      const type = paymentMethodFieldTypes.find(
        (candidate) => candidate === field.type,
      );
      if (
        typeof field.key !== "string" ||
        typeof field.label !== "string" ||
        !type ||
        typeof field.required !== "boolean"
      ) {
        return [];
      }
      return [
        {
          key: field.key,
          label: field.label,
          type,
          required: field.required,
          ...(typeof field.placeholder === "string"
            ? { placeholder: field.placeholder }
            : {}),
          ...(type === "select"
            ? { options: parsePaymentMethodFieldOptions(field.options) }
            : {}),
        },
      ];
    });
  } catch {
    return [];
  }
}

function parsePaymentMethodFieldOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option) => {
    if (
      !isRecord(option) ||
      typeof option.value !== "string" ||
      typeof option.label !== "string"
    ) {
      return [];
    }
    return [{ value: option.value, label: option.label }];
  });
}

export function parsePaymentMethodDetails(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

export function mapPaymentMethodCatalog(record: PaymentMethodCatalogRecord) {
  return {
    id: record.id,
    withdrawFee: record.withdrawFee.toString(),
    minWithdrawAmount: record.minWithdrawAmount.toString(),
    status: record.status,
    translations: record.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name ?? "",
      fields: parsePaymentMethodFields(translation.fieldsJson),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapAdminPaymentMethod(record: PaymentMethodRecord) {
  return {
    ...mapPaymentMethodCatalog(record),
    userMethodCount: record._count.userMethods,
  };
}

export function mapUserPaymentMethod(account: UserPaymentMethodRecord) {
  return {
    id: account.id,
    paymentMethodId: account.paymentMethodId,
    details: parsePaymentMethodDetails(account.detailsJson),
    paymentMethod: mapPaymentMethodCatalog(account.paymentMethod),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
