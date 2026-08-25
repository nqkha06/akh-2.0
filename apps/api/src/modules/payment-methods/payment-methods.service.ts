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
import type {
  CreateUserPaymentMethodDto,
  UpdateUserPaymentMethodDto,
} from "./dto/save-user-payment-method.dto";
import type { UpdatePaymentMethodDto } from "./dto/update-payment-method.dto";
import {
  mapAdminPaymentMethod,
  mapPaymentMethodCatalog,
  mapUserPaymentMethod,
  normalizePaymentMethodFields,
  parsePaymentMethodFields,
} from "./payment-method.mapper";
import {
  assertPaymentFieldSchemaCanChange,
  assertPaymentTranslationsCompatible,
  validatePaymentMethodDetails,
} from "./payment-method.policy";
import {
  PAYMENT_METHOD_INCLUDE,
  PAYMENT_METHOD_TRANSLATIONS_INCLUDE,
  USER_PAYMENT_METHOD_INCLUDE,
} from "./payment-method.select";

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly languagesService: LanguagesService,
  ) {}

  async findAllForAdmin() {
    const records = await this.prisma.paymentMethod.findMany({
      orderBy: [{ status: "asc" }, { id: "asc" }],
      include: PAYMENT_METHOD_INCLUDE,
    });
    return {
      items: records.map(mapAdminPaymentMethod),
      total: records.length,
    };
  }

  async findOneForAdmin(id: number) {
    return mapAdminPaymentMethod(await this.findRecord(id));
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
              normalizePaymentMethodFields(translation.fields),
            ),
          })),
        },
      },
      include: PAYMENT_METHOD_INCLUDE,
    });
    return mapAdminPaymentMethod(record);
  }

  async update(id: number, dto: UpdatePaymentMethodDto) {
    const existing = await this.findRecord(id);
    if (dto.translations) {
      await this.validateTranslations(dto.translations);
      assertPaymentFieldSchemaCanChange(
        existing._count.userMethods,
        parsePaymentMethodFields(existing.translations[0]?.fieldsJson),
        dto.translations[0].fields,
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
                    normalizePaymentMethodFields(translation.fields),
                  ),
                })),
              },
            }
          : {}),
      },
      include: PAYMENT_METHOD_INCLUDE,
    });
    return mapAdminPaymentMethod(record);
  }

  async remove(id: number) {
    const record = await this.findRecord(id);
    if (record._count.userMethods > 0) {
      throw new ConflictException(
        "Phương thức đang được thành viên sử dụng. Hãy chuyển về nháp hoặc chờ xử lý thay vì xóa.",
      );
    }
    await this.prisma.paymentMethod.delete({ where: { id } });
    return { success: true, id };
  }

  async findDashboardForMember(userId: number) {
    const [catalog, accounts] = await this.prisma.$transaction([
      this.prisma.paymentMethod.findMany({
        where: { status: "published" },
        orderBy: { id: "asc" },
        include: PAYMENT_METHOD_TRANSLATIONS_INCLUDE,
      }),
      this.prisma.userPaymentMethod.findMany({
        where: { userId },
        orderBy: { id: "desc" },
        include: USER_PAYMENT_METHOD_INCLUDE,
      }),
    ]);
    const defaultLocale = await this.languagesService.getDefaultLocale();

    return {
      defaultLocale,
      catalog: catalog.map(mapPaymentMethodCatalog),
      accounts: accounts.map(mapUserPaymentMethod),
    };
  }

  async createForMember(userId: number, dto: CreateUserPaymentMethodDto) {
    return this.prisma.$transaction(async (transaction) => {
      const existingAccount = await transaction.userPaymentMethod.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (existingAccount) {
        throw new ConflictException(
          "Mỗi tài khoản chỉ được sử dụng một phương thức thanh toán. Hãy chỉnh sửa phương thức hiện tại.",
        );
      }

      const method = await transaction.paymentMethod.findFirst({
        where: { id: dto.paymentMethodId, status: "published" },
        include: PAYMENT_METHOD_TRANSLATIONS_INCLUDE,
      });
      if (!method) {
        throw new BadRequestException(
          "Phương thức thanh toán không tồn tại hoặc chưa được xuất bản.",
        );
      }
      const details = validatePaymentMethodDetails(method, dto.details);
      const account = await transaction.userPaymentMethod.create({
        data: {
          userId,
          paymentMethodId: method.id,
          detailsJson: JSON.stringify(details),
        },
        include: USER_PAYMENT_METHOD_INCLUDE,
      });
      return mapUserPaymentMethod(account);
    });
  }

  async updateForMember(
    userId: number,
    id: number,
    dto: UpdateUserPaymentMethodDto,
  ) {
    const account = await this.prisma.userPaymentMethod.findFirst({
      where: { id, userId },
      include: USER_PAYMENT_METHOD_INCLUDE,
    });
    if (!account) {
      throw new NotFoundException("Không tìm thấy phương thức thanh toán.");
    }
    const paymentMethodId = dto.paymentMethodId ?? account.paymentMethodId;
    const method = await this.prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, status: "published" },
      include: PAYMENT_METHOD_TRANSLATIONS_INCLUDE,
    });
    if (!method) {
      throw new BadRequestException(
        "Phương thức thanh toán không tồn tại hoặc chưa được xuất bản.",
      );
    }
    const details = validatePaymentMethodDetails(method, dto.details);
    const updated = await this.prisma.userPaymentMethod.update({
      where: { id: account.id },
      data: {
        paymentMethodId: method.id,
        detailsJson: JSON.stringify(details),
      },
      include: USER_PAYMENT_METHOD_INCLUDE,
    });
    return mapUserPaymentMethod(updated);
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
      include: PAYMENT_METHOD_INCLUDE,
    });
    if (!record) {
      throw new NotFoundException("Không tìm thấy phương thức thanh toán.");
    }
    return record;
  }

  private async validateTranslations(
    translations: CreatePaymentMethodDto["translations"],
  ) {
    await this.languagesService.assertTranslationLocales(
      translations.map(({ locale }) => locale),
    );
    assertPaymentTranslationsCompatible(translations);
  }
}
