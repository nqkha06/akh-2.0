import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { rebaseBusinessCurrency } from "./base-currency.service";
import { BusinessSettingsRepository } from "./business-settings.repository";
import {
  buildBusinessSettingsUpdate,
  mapAdminBusinessSettings,
  mapPublicBusinessSettings,
  mapRuntimeBusinessSettings,
  type RuntimeBusinessSettings,
} from "./business-settings.mapper";
import {
  assertUniqueBusinessPresetIds,
  getActiveBusinessCurrencies,
  parseReferralCommissionRate,
  throwBusinessSettingsVersionConflict,
} from "./business-settings.policy";
import { BUSINESS_CURRENCY_SELECT } from "./business-settings.select";
import type { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";

export type { RuntimeBusinessSettings };

@Injectable()
export class BusinessSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: BusinessSettingsRepository,
  ) {}

  async getRuntime() {
    return mapRuntimeBusinessSettings(await this.repository.find());
  }

  async getAdminSettings() {
    const [settings, currencies] = await Promise.all([
      this.repository.find(),
      this.prisma.currency.findMany({
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: BUSINESS_CURRENCY_SELECT,
      }),
    ]);
    return mapAdminBusinessSettings(settings, currencies);
  }

  async getPublicSettings() {
    return mapPublicBusinessSettings(await this.getRuntime());
  }

  async update(dto: UpdateBusinessSettingsDto, adminId: number) {
    assertUniqueBusinessPresetIds(dto.backgroundImages, "ảnh");
    assertUniqueBusinessPresetIds(dto.backgroundVideos, "video");
    const referralRate = parseReferralCommissionRate(
      dto.referralCommissionRate,
    );

    await this.prisma.$transaction(
      async (transaction) => {
        const current = await this.repository.find(transaction);
        const currencies = await transaction.currency.findMany({
          select: BUSINESS_CURRENCY_SELECT,
        });
        const { baseCurrency } = getActiveBusinessCurrencies(
          currencies,
          dto.baseCurrencyCode,
          dto.withdrawalCurrencyCode,
        );

        if (current.baseCurrencyCode !== dto.baseCurrencyCode) {
          await rebaseBusinessCurrency(
            transaction,
            currencies,
            baseCurrency.id,
            baseCurrency.exchangeRate,
          );
        }

        const updated = await this.repository.update(
          transaction,
          dto.version,
          buildBusinessSettingsUpdate(dto, referralRate, adminId),
        );
        if (!updated) {
          throwBusinessSettingsVersionConflict();
        }
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.getAdminSettings();
  }
}
