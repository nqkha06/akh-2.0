import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { BusinessCurrencyRecord } from "./business-settings.select";

export function assertUniqueBusinessPresetIds(
  items: Array<{ id: string }>,
  label: string,
) {
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new BadRequestException(`ID preset ${label} không được trùng nhau.`);
  }
}

export function parseReferralCommissionRate(value: string) {
  const rate = new Prisma.Decimal(value);
  if (rate.lessThan(0) || rate.greaterThan(100)) {
    throw new BadRequestException("Hoa hồng giới thiệu phải từ 0 đến 100%.");
  }
  return rate;
}

export function getActiveBusinessCurrencies(
  currencies: BusinessCurrencyRecord[],
  baseCode: string,
  withdrawalCode: string,
) {
  const baseCurrency = currencies.find(
    (currency) => currency.code === baseCode && currency.isActive,
  );
  const withdrawalCurrency = currencies.find(
    (currency) => currency.code === withdrawalCode && currency.isActive,
  );
  if (!baseCurrency || !withdrawalCurrency) {
    throw new BadRequestException(
      "Tiền cơ sở và tiền rút phải là tiền tệ đang hoạt động.",
    );
  }
  return { baseCurrency, withdrawalCurrency };
}

export function throwBusinessSettingsVersionConflict(): never {
  throw new ConflictException({
    code: "BUSINESS_SETTINGS_VERSION_CONFLICT",
    message: "Cấu hình đã được quản trị viên khác cập nhật. Hãy tải lại trang.",
  });
}

export function throwBaseCurrencyInUse(): never {
  throw new ConflictException({
    code: "BASE_CURRENCY_IN_USE",
    message:
      "Không thể đổi tiền hạch toán khi đã có số dư, hoa hồng hoặc giao dịch rút tiền.",
  });
}
