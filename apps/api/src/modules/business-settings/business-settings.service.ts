import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { Prisma, type BusinessSettings } from "@prisma/client";
import {
  DEFAULT_BACKGROUND_IMAGE_PRESETS,
  DEFAULT_BACKGROUND_VIDEO_PRESETS,
  DEFAULT_UPLOAD_MIME_TYPES,
  BUNDLED_UI_LOCALES,
  type BackgroundImagePreset,
  type BackgroundVideoPreset,
} from "@stu/contracts";

import { PrismaService } from "../../database/prisma/prisma.service";
import { BusinessSettingsRepository } from "./business-settings.repository";
import type { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";

export type RuntimeBusinessSettings = ReturnType<BusinessSettingsService["toRuntime"]>;

@Injectable()
export class BusinessSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: BusinessSettingsRepository,
  ) {}

  async getRuntime() {
    return this.toRuntime(await this.repository.find());
  }

  async getAdminSettings() {
    const [settings, currencies] = await Promise.all([
      this.repository.find(),
      this.prisma.currency.findMany({
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: {
          code: true,
          name: true,
          symbol: true,
          exchangeRate: true,
          isBase: true,
          isDefault: true,
          isActive: true,
        },
      }),
    ]);
    return {
      ...this.toResponse(settings),
      currencies: currencies.map((currency) => ({
        ...currency,
        exchangeRate: currency.exchangeRate.toString(),
      })),
      uiLanguages: {
        bundled: [...BUNDLED_UI_LOCALES],
        source: "published-languages",
        fallbackLocale: "en",
      },
    };
  }

  async getPublicSettings() {
    const settings = await this.getRuntime();
    return {
      version: settings.version,
      authentication: {
        registrationEnabled: settings.registrationEnabled,
        googleLoginEnabled: settings.googleLoginEnabled,
      },
      operations: {
        maintenanceMode: settings.maintenanceMode,
        withdrawalsPaused: settings.withdrawalsPaused,
      },
      uploads: {
        memberFileMaxBytes: settings.memberFileMaxBytes,
        coverImageMaxBytes: settings.coverImageMaxBytes,
        allowedMimeTypes: settings.uploadAllowedMimeTypes,
      },
      presetLibrary: {
        images: settings.backgroundImages.filter((preset) => preset.enabled),
        videos: settings.backgroundVideos.filter((preset) => preset.enabled),
      },
    };
  }

  async update(dto: UpdateBusinessSettingsDto, adminId: number) {
    this.assertUniquePresetIds(dto.backgroundImages, "ảnh");
    this.assertUniquePresetIds(dto.backgroundVideos, "video");
    const referralRate = new Prisma.Decimal(dto.referralCommissionRate);
    if (referralRate.lessThan(0) || referralRate.greaterThan(100)) {
      throw new BadRequestException("Hoa hồng giới thiệu phải từ 0 đến 100%.");
    }

    await this.prisma.$transaction(
      async (transaction) => {
        const current = await this.repository.find(transaction);
        const currencies = await transaction.currency.findMany();
        const baseCurrency = currencies.find(
          (currency) => currency.code === dto.baseCurrencyCode && currency.isActive,
        );
        const withdrawalCurrency = currencies.find(
          (currency) =>
            currency.code === dto.withdrawalCurrencyCode && currency.isActive,
        );
        if (!baseCurrency || !withdrawalCurrency) {
          throw new BadRequestException(
            "Tiền cơ sở và tiền rút phải là tiền tệ đang hoạt động.",
          );
        }

        if (current.baseCurrencyCode !== dto.baseCurrencyCode) {
          await this.changeBaseCurrency(
            transaction,
            currencies,
            baseCurrency.id,
            baseCurrency.exchangeRate,
          );
        }

        const updated = await this.repository.update(transaction, dto.version, {
          registrationEnabled: dto.registrationEnabled,
          emailVerificationRequired: dto.emailVerificationRequired,
          googleLoginEnabled: dto.googleLoginEnabled,
          baseCurrencyCode: dto.baseCurrencyCode,
          withdrawalCurrencyCode: dto.withdrawalCurrencyCode,
          referralCommissionRate: referralRate,
          loyaltyWindowDays: dto.loyaltyWindowDays,
          loyaltyHistoryDays: dto.loyaltyHistoryDays,
          memberFileMaxBytes: BigInt(dto.memberFileMaxBytes),
          coverImageMaxBytes: BigInt(dto.coverImageMaxBytes),
          adminMediaMaxBytes: BigInt(dto.adminMediaMaxBytes),
          supportAttachmentMaxBytes: BigInt(dto.supportAttachmentMaxBytes),
          memberStorageQuotaBytes: BigInt(dto.memberStorageQuotaBytes),
          uploadAllowedMimeTypesJson: JSON.stringify(
            [...new Set(dto.uploadAllowedMimeTypes)].sort(),
          ),
          backgroundImagesJson: JSON.stringify(dto.backgroundImages),
          backgroundVideosJson: JSON.stringify(dto.backgroundVideos),
          maintenanceMode: dto.maintenanceMode,
          withdrawalsPaused: dto.withdrawalsPaused,
          updatedById: adminId,
        });
        if (!updated) {
          throw new ConflictException({
            code: "BUSINESS_SETTINGS_VERSION_CONFLICT",
            message:
              "Cấu hình đã được quản trị viên khác cập nhật. Hãy tải lại trang.",
          });
        }
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.getAdminSettings();
  }

  private async changeBaseCurrency(
    transaction: Prisma.TransactionClient,
    currencies: Array<{ id: number; exchangeRate: Prisma.Decimal }>,
    nextBaseId: number,
    nextBaseRate: Prisma.Decimal,
  ) {
    const [withdrawals, commissions, nonZeroBalances] = await Promise.all([
      transaction.userWithdrawal.count(),
      transaction.commission.count(),
      transaction.user.count({ where: { balance: { not: 0 } } }),
    ]);
    if (withdrawals || commissions || nonZeroBalances) {
      throw new ConflictException({
        code: "BASE_CURRENCY_IN_USE",
        message:
          "Không thể đổi tiền hạch toán khi đã có số dư, hoa hồng hoặc giao dịch rút tiền.",
      });
    }
    const paymentMethods = await transaction.paymentMethod.findMany({
      select: { id: true, withdrawFee: true, minWithdrawAmount: true },
    });
    for (const method of paymentMethods) {
      await transaction.paymentMethod.update({
        where: { id: method.id },
        data: {
          withdrawFee: method.withdrawFee.mul(nextBaseRate),
          minWithdrawAmount: method.minWithdrawAmount.mul(nextBaseRate),
        },
      });
    }
    for (const currency of currencies) {
      await transaction.currency.update({
        where: { id: currency.id },
        data: {
          isBase: currency.id === nextBaseId,
          isActive: currency.id === nextBaseId ? true : undefined,
          exchangeRate: currency.exchangeRate.div(nextBaseRate),
        },
      });
    }
  }

  private assertUniquePresetIds(items: Array<{ id: string }>, label: string) {
    if (new Set(items.map((item) => item.id)).size !== items.length) {
      throw new BadRequestException(`ID preset ${label} không được trùng nhau.`);
    }
  }

  private toResponse(settings: BusinessSettings) {
    const runtime = this.toRuntime(settings);
    return {
      ...runtime,
      referralCommissionRate: runtime.referralCommissionRate.toFixed(2),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  toRuntime(settings: BusinessSettings) {
    return {
      version: settings.version,
      registrationEnabled: settings.registrationEnabled,
      emailVerificationRequired: settings.emailVerificationRequired,
      googleLoginEnabled: settings.googleLoginEnabled,
      baseCurrencyCode: settings.baseCurrencyCode,
      withdrawalCurrencyCode: settings.withdrawalCurrencyCode,
      referralCommissionRate: settings.referralCommissionRate,
      loyaltyWindowDays: settings.loyaltyWindowDays,
      loyaltyHistoryDays: settings.loyaltyHistoryDays,
      memberFileMaxBytes: Number(settings.memberFileMaxBytes),
      coverImageMaxBytes: Number(settings.coverImageMaxBytes),
      adminMediaMaxBytes: Number(settings.adminMediaMaxBytes),
      supportAttachmentMaxBytes: Number(settings.supportAttachmentMaxBytes),
      memberStorageQuotaBytes: Number(settings.memberStorageQuotaBytes),
      uploadAllowedMimeTypes: this.parseStringArray(
        settings.uploadAllowedMimeTypesJson,
        [...DEFAULT_UPLOAD_MIME_TYPES],
      ),
      backgroundImages: this.parsePresets<BackgroundImagePreset>(
        settings.backgroundImagesJson,
        DEFAULT_BACKGROUND_IMAGE_PRESETS,
      ),
      backgroundVideos: this.parsePresets<BackgroundVideoPreset>(
        settings.backgroundVideosJson,
        DEFAULT_BACKGROUND_VIDEO_PRESETS,
      ),
      maintenanceMode: settings.maintenanceMode,
      withdrawalsPaused: settings.withdrawalsPaused,
    };
  }

  private parseStringArray(value: string, fallback: string[]) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) && parsed.length > 0 && parsed.every((item) => typeof item === "string")
        ? parsed
        : fallback;
    } catch {
      return fallback;
    }
  }

  private parsePresets<T>(value: string, fallback: T[]) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) && parsed.length ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
}
