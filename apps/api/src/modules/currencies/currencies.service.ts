import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import {
  BASE_CURRENCY_CODE,
  USER_CURRENCY_META_KEY,
} from "./currency.constants";
import type { CreateCurrencyDto } from "./dto/create-currency.dto";
import type { UpdateCurrencyDto } from "./dto/update-currency.dto";

@Injectable()
export class CurrenciesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const usd = await this.prisma.currency.upsert({
      where: { code: BASE_CURRENCY_CODE },
      update: { isBase: true, exchangeRate: new Prisma.Decimal(1) },
      create: {
        code: BASE_CURRENCY_CODE,
        name: "US Dollar",
        symbol: "$",
        exchangeRate: new Prisma.Decimal(1),
        decimalDigits: 2,
        isBase: true,
        isDefault: true,
        isActive: true,
        sortOrder: 10,
      },
    });
    const defaultCurrency = await this.prisma.currency.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    if (!defaultCurrency) {
      await this.prisma.currency.update({
        where: { id: usd.id },
        data: { isDefault: true, isActive: true },
      });
    }
  }

  async findAllForAdmin() {
    const items = await this.prisma.currency.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });
    return {
      items: items.map((currency) => this.toResponse(currency)),
      total: items.length,
      baseCurrency:
        items.find((currency) => currency.isBase)?.code ??
        BASE_CURRENCY_CODE,
      defaultCurrency:
        items.find((currency) => currency.isDefault)?.code ??
        BASE_CURRENCY_CODE,
    };
  }

  async findMemberPreferences(userId: number) {
    const [currencies, meta] = await this.prisma.$transaction([
      this.prisma.currency.findMany({
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      }),
      this.prisma.userMeta.findUnique({
        where: {
          userId_key: {
            userId,
            key: USER_CURRENCY_META_KEY,
          },
        },
      }),
    ]);
    const availableCurrencies = currencies.filter(
      (currency) => currency.isActive,
    );
    const defaultCurrency =
      availableCurrencies.find((currency) => currency.isDefault) ??
      availableCurrencies.find((currency) => currency.isBase) ??
      availableCurrencies[0];
    if (!defaultCurrency) {
      throw new ConflictException({
        code: "CURRENCY_CONFIGURATION_EMPTY",
        message: "Hệ thống chưa có tiền tệ đang hoạt động.",
      });
    }
    const selectedCode = this.parseCurrencyMeta(meta?.valueJson);
    const selected =
      availableCurrencies.find((currency) => currency.code === selectedCode) ??
      defaultCurrency;

    return {
      currency: selected.code,
      baseCurrency:
        currencies.find((currency) => currency.isBase)?.code ??
        BASE_CURRENCY_CODE,
      defaultCurrency: defaultCurrency.code,
      currencies: currencies.map((currency) => this.toResponse(currency)),
    };
  }

  async updateMemberCurrency(userId: number, code: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { code },
    });
    if (!currency || !currency.isActive) {
      throw new BadRequestException({
        code: "CURRENCY_NOT_AVAILABLE",
        message: "Tiền tệ đã chọn không tồn tại hoặc đang bị tắt.",
      });
    }
    await this.prisma.userMeta.upsert({
      where: {
        userId_key: {
          userId,
          key: USER_CURRENCY_META_KEY,
        },
      },
      create: {
        userId,
        key: USER_CURRENCY_META_KEY,
        valueJson: JSON.stringify(currency.code),
        valueType: "string",
      },
      update: {
        valueJson: JSON.stringify(currency.code),
        valueType: "string",
      },
    });
    return this.findMemberPreferences(userId);
  }

  async create(dto: CreateCurrencyDto) {
    this.assertPositiveRate(dto.exchangeRate);
    if (!dto.name.trim() || !dto.symbol.trim()) {
      throw new BadRequestException("Tên và ký hiệu tiền tệ không được rỗng.");
    }
    try {
      const currency = await this.prisma.$transaction(async (transaction) => {
        if (dto.isDefault) {
          await transaction.currency.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
          });
        }
        return transaction.currency.create({
          data: {
            code: dto.code,
            name: dto.name.trim(),
            symbol: dto.symbol.trim(),
            exchangeRate: new Prisma.Decimal(dto.exchangeRate),
            decimalDigits: dto.decimalDigits,
            isDefault: dto.isDefault ?? false,
            isActive: dto.isDefault ? true : dto.isActive,
            sortOrder: dto.sortOrder,
          },
        });
      });
      return this.toResponse(currency);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateCurrencyDto) {
    const existing = await this.findOne(id);
    if (dto.exchangeRate !== undefined) {
      this.assertPositiveRate(dto.exchangeRate);
      if (existing.isBase && !new Prisma.Decimal(dto.exchangeRate).equals(1)) {
        throw new BadRequestException(
          "Tỷ giá của tiền tệ cơ sở USD luôn phải bằng 1.",
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

    const currency = await this.prisma.$transaction(async (transaction) => {
      if (dto.isDefault === true) {
        await transaction.currency.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return transaction.currency.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.symbol !== undefined ? { symbol: dto.symbol.trim() } : {}),
          ...(dto.exchangeRate !== undefined
            ? { exchangeRate: new Prisma.Decimal(dto.exchangeRate) }
            : {}),
          ...(dto.decimalDigits !== undefined
            ? { decimalDigits: dto.decimalDigits }
            : {}),
          ...(dto.isDefault !== undefined
            ? { isDefault: dto.isDefault, isActive: true }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
      });
    });
    return this.toResponse(currency);
  }

  async setDefault(id: number) {
    const existing = await this.findOne(id);
    const currency = await this.prisma.$transaction(async (transaction) => {
      await transaction.currency.updateMany({
        where: { isDefault: true, id: { not: existing.id } },
        data: { isDefault: false },
      });
      return transaction.currency.update({
        where: { id: existing.id },
        data: { isDefault: true, isActive: true },
      });
    });
    return this.toResponse(currency);
  }

  async remove(id: number) {
    const currency = await this.findOne(id);
    if (currency.isBase) {
      throw new ConflictException({
        code: "BASE_CURRENCY_DELETE_FORBIDDEN",
        message: "Không thể xóa tiền tệ cơ sở USD.",
      });
    }
    if (currency.isDefault) {
      throw new ConflictException({
        code: "DEFAULT_CURRENCY_DELETE_FORBIDDEN",
        message: "Hãy đặt tiền tệ khác làm mặc định trước khi xóa.",
      });
    }
    const usageCount = await this.prisma.userMeta.count({
      where: {
        key: USER_CURRENCY_META_KEY,
        valueJson: JSON.stringify(currency.code),
      },
    });
    if (usageCount > 0) {
      throw new ConflictException({
        code: "CURRENCY_IN_USE",
        message: `Tiền tệ đang được ${usageCount} người dùng lựa chọn. Hãy tắt thay vì xóa.`,
        usageCount,
      });
    }
    await this.prisma.currency.delete({ where: { id } });
    return { success: true, id };
  }

  private async findOne(id: number) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException("Không tìm thấy tiền tệ.");
    return currency;
  }

  private assertPositiveRate(value: string) {
    if (new Prisma.Decimal(value).lessThanOrEqualTo(0)) {
      throw new BadRequestException("Tỷ giá phải lớn hơn 0.");
    }
  }

  private parseCurrencyMeta(value: string | undefined) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      return typeof parsed === "string" ? parsed : null;
    } catch {
      return null;
    }
  }

  private toResponse(currency: {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: Prisma.Decimal;
    decimalDigits: number;
    isBase: boolean;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...currency,
      exchangeRate: currency.exchangeRate.toString(),
    };
  }

  private rethrowUnique(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException({
        code: "CURRENCY_CODE_EXISTS",
        message: "Mã tiền tệ đã tồn tại.",
      });
    }
  }
}
