import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { LanguagesService } from "../languages/languages.service";
import type { CreatePaymentMethodDto } from "./dto/create-payment-method.dto";
import type { PaymentMethodFieldDto } from "./dto/payment-method-field.dto";
import type {
  CreateUserPaymentMethodDto,
  UpdateUserPaymentMethodDto,
} from "./dto/save-user-payment-method.dto";
import type { UpdatePaymentMethodDto } from "./dto/update-payment-method.dto";

const paymentMethodInclude = {
  translations: { orderBy: { locale: "asc" } },
  _count: { select: { userMethods: true } },
} satisfies Prisma.PaymentMethodInclude;

type PaymentMethodRecord = Prisma.PaymentMethodGetPayload<{
  include: typeof paymentMethodInclude;
}>;

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly languagesService: LanguagesService,
  ) {}

  async findAllForAdmin() {
    const records = await this.prisma.paymentMethod.findMany({
      orderBy: [{ status: "asc" }, { id: "asc" }],
      include: paymentMethodInclude,
    });
    return {
      items: records.map((record) => this.toAdminResponse(record)),
      total: records.length,
    };
  }

  async findOneForAdmin(id: number) {
    return this.toAdminResponse(await this.findRecord(id));
  }

  async create(dto: CreatePaymentMethodDto) {
    await this.validateTranslations(dto.translations);
    const record = await this.prisma.paymentMethod.create({
      data: {
        withdrawFee: new Prisma.Decimal(dto.withdrawFee),
        minWithdrawAmount: new Prisma.Decimal(dto.minWithdrawAmount),
        status: dto.status,
        translations: {
          create: dto.translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name.trim(),
            fieldsJson: JSON.stringify(
              this.normalizeFields(translation.fields),
            ),
          })),
        },
      },
      include: paymentMethodInclude,
    });
    return this.toAdminResponse(record);
  }

  async update(id: number, dto: UpdatePaymentMethodDto) {
    const existing = await this.findRecord(id);
    if (dto.translations) await this.validateTranslations(dto.translations);
    if (
      dto.translations &&
      existing._count.userMethods > 0 &&
      this.fieldSignature(dto.translations[0].fields) !==
        this.fieldSignature(
          this.parseFields(existing.translations[0]?.fieldsJson),
        )
    ) {
      throw new ConflictException(
        "Không thể đổi key, kiểu hoặc field bắt buộc khi phương thức đã được member sử dụng. Bạn vẫn có thể sửa tên và nội dung hiển thị.",
      );
    }

    const record = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(dto.withdrawFee !== undefined
          ? { withdrawFee: new Prisma.Decimal(dto.withdrawFee) }
          : {}),
        ...(dto.minWithdrawAmount !== undefined
          ? { minWithdrawAmount: new Prisma.Decimal(dto.minWithdrawAmount) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.translations
          ? {
              translations: {
                deleteMany: {},
                create: dto.translations.map((translation) => ({
                  locale: translation.locale,
                  name: translation.name.trim(),
                  fieldsJson: JSON.stringify(
                    this.normalizeFields(translation.fields),
                  ),
                })),
              },
            }
          : {}),
      },
      include: paymentMethodInclude,
    });
    return this.toAdminResponse(record);
  }

  async remove(id: number) {
    const record = await this.findRecord(id);
    if (record._count.userMethods > 0) {
      throw new ConflictException(
        "Phương thức đang được thành viên sử dụng. Hãy chuyển sang trạng thái không hoạt động thay vì xóa.",
      );
    }
    await this.prisma.paymentMethod.delete({ where: { id } });
    return { success: true, id };
  }

  async findDashboardForMember(userId: number) {
    const [catalog, accounts] = await this.prisma.$transaction([
      this.prisma.paymentMethod.findMany({
        where: { status: "active" },
        orderBy: { id: "asc" },
        include: { translations: { orderBy: { locale: "asc" } } },
      }),
      this.prisma.userPaymentMethod.findMany({
        where: { userId },
        orderBy: { id: "desc" },
        include: {
          paymentMethod: {
            include: { translations: { orderBy: { locale: "asc" } } },
          },
        },
      }),
    ]);
    const defaultLocale = await this.languagesService.getDefaultLocale();

    return {
      defaultLocale,
      catalog: catalog.map((record) => this.toCatalogResponse(record)),
      accounts: accounts.map((account) => ({
        id: account.id,
        paymentMethodId: account.paymentMethodId,
        details: this.parseDetails(account.detailsJson),
        paymentMethod: this.toCatalogResponse(account.paymentMethod),
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      })),
    };
  }

  async createForMember(userId: number, dto: CreateUserPaymentMethodDto) {
    const method = await this.findActiveMethod(dto.paymentMethodId);
    const details = this.validateDetails(method, dto.details);
    const account = await this.prisma.userPaymentMethod.create({
      data: {
        userId,
        paymentMethodId: method.id,
        detailsJson: JSON.stringify(details),
      },
      include: {
        paymentMethod: { include: { translations: true } },
      },
    });
    return {
      id: account.id,
      paymentMethodId: account.paymentMethodId,
      details,
      paymentMethod: this.toCatalogResponse(account.paymentMethod),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  async updateForMember(
    userId: number,
    id: number,
    dto: UpdateUserPaymentMethodDto,
  ) {
    const account = await this.prisma.userPaymentMethod.findFirst({
      where: { id, userId },
      include: {
        paymentMethod: { include: { translations: true } },
      },
    });
    if (!account) {
      throw new NotFoundException("Không tìm thấy phương thức thanh toán.");
    }
    if (account.paymentMethod.status !== "active") {
      throw new BadRequestException(
        "Phương thức này đang tạm ngưng và không thể cập nhật.",
      );
    }
    const details = this.validateDetails(account.paymentMethod, dto.details);
    const updated = await this.prisma.userPaymentMethod.update({
      where: { id: account.id },
      data: { detailsJson: JSON.stringify(details) },
      include: {
        paymentMethod: { include: { translations: true } },
      },
    });
    return {
      id: updated.id,
      paymentMethodId: updated.paymentMethodId,
      details,
      paymentMethod: this.toCatalogResponse(updated.paymentMethod),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async removeForMember(userId: number, id: number) {
    const result = await this.prisma.userPaymentMethod.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException("Không tìm thấy phương thức thanh toán.");
    }
    return { success: true, id };
  }

  private async findRecord(id: number) {
    const record = await this.prisma.paymentMethod.findUnique({
      where: { id },
      include: paymentMethodInclude,
    });
    if (!record) {
      throw new NotFoundException("Không tìm thấy phương thức thanh toán.");
    }
    return record;
  }

  private async findActiveMethod(id: number) {
    const record = await this.prisma.paymentMethod.findFirst({
      where: { id, status: "active" },
      include: { translations: true },
    });
    if (!record) {
      throw new BadRequestException(
        "Phương thức thanh toán không tồn tại hoặc đang tạm ngưng.",
      );
    }
    return record;
  }

  private async validateTranslations(
    translations: CreatePaymentMethodDto["translations"],
  ) {
    const locales = translations.map(({ locale }) => locale);
    await this.languagesService.assertTranslationLocales(locales);

    const signatures = translations.map((translation) => {
      const keys = translation.fields.map(({ key }) => key);
      if (new Set(keys).size !== keys.length) {
        throw new BadRequestException(
          `Field key trong bản dịch "${translation.locale}" không được trùng nhau.`,
        );
      }
      return translation.fields
        .map(({ key, type, required }) => `${key}:${type}:${required}`)
        .sort()
        .join("|");
    });
    if (new Set(signatures).size !== 1) {
      throw new BadRequestException(
        "Hai bản dịch phải có cùng field key, kiểu dữ liệu và trạng thái bắt buộc.",
      );
    }
  }

  private validateDetails(
    method: {
      translations: Array<{ locale: string; fieldsJson: string | null }>;
    },
    rawDetails: Record<string, unknown>,
  ) {
    const translation =
      method.translations.find(({ locale }) => locale === "vi") ??
      method.translations.find(({ locale }) => locale === "en") ??
      method.translations[0];
    const fields = this.parseFields(translation?.fieldsJson);
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
        throw new BadRequestException(
          `"${field.label}" là thông tin bắt buộc.`,
        );
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
      if (
        value &&
        field.type === "number" &&
        !/^-?\d+(?:\.\d+)?$/.test(value)
      ) {
        throw new BadRequestException(`"${field.label}" phải là một số.`);
      }
      if (value) details[field.key] = value;
    }
    return details;
  }

  private normalizeFields(fields: PaymentMethodFieldDto[]) {
    return fields.map((field) => ({
      key: field.key,
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      ...(field.placeholder?.trim()
        ? { placeholder: field.placeholder.trim() }
        : {}),
    }));
  }

  private fieldSignature(fields: PaymentMethodFieldDto[]) {
    return fields
      .map(({ key, type, required }) => `${key}:${type}:${required}`)
      .sort()
      .join("|");
  }

  private toAdminResponse(record: PaymentMethodRecord) {
    return {
      ...this.toCatalogResponse(record),
      userMethodCount: record._count.userMethods,
    };
  }

  private toCatalogResponse(record: {
    id: number;
    withdrawFee: Prisma.Decimal;
    minWithdrawAmount: Prisma.Decimal;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    translations: Array<{
      locale: string;
      name: string | null;
      fieldsJson: string | null;
    }>;
  }) {
    return {
      id: record.id,
      withdrawFee: record.withdrawFee.toString(),
      minWithdrawAmount: record.minWithdrawAmount.toString(),
      status: record.status,
      translations: record.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name ?? "",
        fields: this.parseFields(translation.fieldsJson),
      })),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private parseFields(value: string | null | undefined) {
    if (!value) return [] as PaymentMethodFieldDto[];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? (parsed.filter(
            (field): field is PaymentMethodFieldDto =>
              field !== null &&
              typeof field === "object" &&
              typeof field.key === "string" &&
              typeof field.label === "string",
          ) as PaymentMethodFieldDto[])
        : [];
    } catch {
      return [];
    }
  }

  private parseDetails(value: string) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, string>)
        : {};
    } catch {
      return {};
    }
  }
}
