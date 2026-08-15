import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma, type Currency } from "@prisma/client";

import type { CreateCurrencyDto } from "./dto/create-currency.dto";
import type { UpdateCurrencyDto } from "./dto/update-currency.dto";

export function assertCurrencyCreateInput(dto: CreateCurrencyDto) {
  assertPositiveCurrencyRate(dto.exchangeRate);
  if (!dto.name.trim() || !dto.symbol.trim()) {
    throw new BadRequestException("Tên và ký hiệu tiền tệ không được rỗng.");
  }
}

export function assertCurrencyUpdateAllowed(
  existing: Currency,
  dto: UpdateCurrencyDto,
) {
  if (dto.exchangeRate !== undefined) {
    assertPositiveCurrencyRate(dto.exchangeRate);
    if (existing.isBase && !new Prisma.Decimal(dto.exchangeRate).equals(1)) {
      throw new BadRequestException(
        `Tỷ giá của tiền tệ cơ sở ${existing.code} luôn phải bằng 1.`,
      );
    }
  }
  if (existing.isDefault && dto.isDefault === false) {
    throw new BadRequestException(
      "Hãy đặt một tiền tệ khác làm mặc định trước.",
    );
  }
  if ((existing.isDefault || existing.isBase) && dto.isActive === false) {
    throw new BadRequestException(
      "Không thể tắt tiền tệ cơ sở hoặc tiền tệ mặc định.",
    );
  }
  if (dto.name !== undefined && !dto.name.trim()) {
    throw new BadRequestException("Tên tiền tệ không được rỗng.");
  }
  if (dto.symbol !== undefined && !dto.symbol.trim()) {
    throw new BadRequestException("Ký hiệu tiền tệ không được rỗng.");
  }
}

export function assertCurrencyCanBeRemoved(currency: Currency) {
  if (currency.isBase) {
    throw new ConflictException({
      code: "BASE_CURRENCY_DELETE_FORBIDDEN",
      message: `Không thể xóa tiền tệ cơ sở ${currency.code}.`,
    });
  }
  if (currency.isDefault) {
    throw new ConflictException({
      code: "DEFAULT_CURRENCY_DELETE_FORBIDDEN",
      message: "Hãy đặt tiền tệ khác làm mặc định trước khi xóa.",
    });
  }
}

export function assertCurrencyIsUnused(usageCount: number) {
  if (usageCount > 0) {
    throw new ConflictException({
      code: "CURRENCY_IN_USE",
      message: `Tiền tệ đang được ${usageCount} người dùng lựa chọn. Hãy tắt thay vì xóa.`,
      usageCount,
    });
  }
}

function assertPositiveCurrencyRate(value: string) {
  if (new Prisma.Decimal(value).lessThanOrEqualTo(0)) {
    throw new BadRequestException("Tỷ giá phải lớn hơn 0.");
  }
}
