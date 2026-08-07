import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { BusinessSettingsService } from "../business-settings/business-settings.service";
import { ReferralsService } from "../referrals/referrals.service";
import type { CreateWithdrawalDto } from "./dto/create-withdrawal.dto";
import type { EstimateWithdrawalDto } from "./dto/estimate-withdrawal.dto";
import type { ListWithdrawalsQueryDto } from "./dto/list-withdrawals-query.dto";

const withdrawalInclude = {
  user: { select: { id: true, name: true, email: true } },
  processedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.UserWithdrawalInclude;

type WithdrawalRecord = Prisma.UserWithdrawalGetPayload<{
  include: typeof withdrawalInclude;
}>;

type PaymentSnapshot = {
  paymentMethodId: number;
  paymentMethodName: string;
  details: Record<string, string>;
};

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referralsService: ReferralsService,
    private readonly businessSettings: BusinessSettingsService,
  ) {}

  async getMemberDashboard(userId: number) {
    const settlement = await this.getWithdrawalCurrency();
    const [user, accounts, withdrawals, pending, paid] =
      await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        }),
        this.prisma.userPaymentMethod.findMany({
          where: { userId, paymentMethod: { status: "published" } },
          orderBy: { id: "desc" },
          include: {
            paymentMethod: {
              include: { translations: { orderBy: { locale: "asc" } } },
            },
          },
        }),
        this.prisma.userWithdrawal.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: withdrawalInclude,
        }),
        this.prisma.userWithdrawal.aggregate({
          where: { userId, status: { in: ["pending", "processing"] } },
          _sum: { amount: true },
        }),
        this.prisma.userWithdrawal.aggregate({
          where: { userId, status: "paid" },
          _sum: { netAmount: true },
        }),
      ]);

    if (!user) throw new NotFoundException("Không tìm thấy người dùng.");

    return {
      currency: settlement.code,
      availableBalance: this.fromBase(user.balance, settlement).toString(),
      pendingBalance: this.fromBase(
        pending._sum.amount ?? new Prisma.Decimal(0),
        settlement,
      ).toString(),
      totalReceived: this.fromBase(
        paid._sum.netAmount ?? new Prisma.Decimal(0),
        settlement,
      ).toString(),
      accounts: accounts.map((account) => ({
        id: account.id,
        paymentMethodId: account.paymentMethodId,
        details: this.parseDetails(account.detailsJson),
        paymentMethod: {
          id: account.paymentMethod.id,
          withdrawFee: this.fromBase(
            account.paymentMethod.withdrawFee,
            settlement,
          ).toString(),
          minWithdrawAmount:
            this.fromBase(
              account.paymentMethod.minWithdrawAmount,
              settlement,
            ).toString(),
          status: account.paymentMethod.status,
          translations: account.paymentMethod.translations.map(
            (translation) => ({
              locale: translation.locale,
              name: translation.name ?? "",
            }),
          ),
        },
      })),
      withdrawals: withdrawals.map((record) =>
        this.toResponse(record, false),
      ),
    };
  }

  async estimate(userId: number, dto: EstimateWithdrawalDto) {
    const settlement = await this.getWithdrawalCurrency();
    const amount = this.toBase(this.parseAmount(dto.amount), settlement);
    const account = await this.findAvailableAccount(
      userId,
      dto.userPaymentMethodId,
    );
    const estimate = this.calculateEstimate(
      amount,
      account.paymentMethod.withdrawFee,
      account.paymentMethod.minWithdrawAmount,
    );
    return this.toSettlementEstimate(estimate, settlement);
  }

  async create(userId: number, dto: CreateWithdrawalDto) {
    const settlement = await this.getWithdrawalCurrency();
    if (settlement.withdrawalsPaused || settlement.maintenanceMode) {
      throw new ConflictException(
        settlement.maintenanceMode
          ? "Hệ thống đang bảo trì. Yêu cầu rút tiền tạm thời chưa khả dụng."
          : "Quản trị viên đang tạm dừng tiếp nhận yêu cầu rút tiền.",
      );
    }
    const amount = this.toBase(this.parseAmount(dto.amount), settlement);
    const existing = await this.prisma.userWithdrawal.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: withdrawalInclude,
    });
    if (existing) return this.resolveIdempotent(existing, userId, dto, amount);

    const account = await this.findAvailableAccount(
      userId,
      dto.userPaymentMethodId,
    );
    const estimate = this.calculateEstimate(
      amount,
      account.paymentMethod.withdrawFee,
      account.paymentMethod.minWithdrawAmount,
    );
    const snapshot: PaymentSnapshot = {
      paymentMethodId: account.paymentMethodId,
      paymentMethodName: this.resolveMethodName(
        account.paymentMethod.translations,
      ),
      details: this.parseDetails(account.detailsJson),
    };

    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const debited = await tx.user.updateMany({
          where: { id: userId, status: "active", balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (debited.count === 0) {
          throw new BadRequestException(
            "Số dư không đủ hoặc tài khoản không thể rút tiền.",
          );
        }
        return tx.userWithdrawal.create({
          data: {
            userId,
            userPaymentMethodId: account.id,
            amount,
            feeAmount: new Prisma.Decimal(estimate.feeAmount),
            netAmount: new Prisma.Decimal(estimate.netAmount),
            currency: settlement.code,
            exchangeRate: settlement.exchangeRate,
            status: "pending",
            paymentSnapshotJson: JSON.stringify(snapshot),
            idempotencyKey: dto.idempotencyKey,
          },
          include: withdrawalInclude,
        });
      });
      return this.toResponse(record, false);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const duplicate = await this.prisma.userWithdrawal.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: withdrawalInclude,
        });
        if (duplicate) {
          return this.resolveIdempotent(duplicate, userId, dto, amount);
        }
      }
      throw error;
    }
  }

  async cancel(userId: number, id: number) {
    return this.refundAndTransition({
      id,
      userId,
      allowedStatuses: ["pending"],
      nextStatus: "cancelled",
      message: "Chỉ yêu cầu đang chờ mới có thể hủy.",
    });
  }

  async findAllForAdmin(query: ListWithdrawalsQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWithdrawalWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: search } } },
              { user: { email: { contains: search } } },
              ...(/^\d+$/.test(search) ? [{ id: Number(search) }] : []),
            ],
          }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.userWithdrawal.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
        include: withdrawalInclude,
      }),
      this.prisma.userWithdrawal.count({ where }),
    ]);
    return {
      items: records.map((record) => this.toResponse(record, false)),
      total,
      page: query.page,
      perPage: query.perPage,
      pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    };
  }

  async findOneForAdmin(id: number) {
    return this.toResponse(await this.findRecord(id), true);
  }

  async process(id: number, adminId: number) {
    const changed = await this.prisma.userWithdrawal.updateMany({
      where: { id, status: "pending" },
      data: {
        status: "processing",
        statusReason: null,
        processedById: adminId,
        processedAt: new Date(),
      },
    });
    if (changed.count === 0) {
      await this.assertExists(id);
      throw new ConflictException(
        "Chỉ yêu cầu đang chờ mới có thể tiếp nhận xử lý.",
      );
    }
    return this.toResponse(await this.findRecord(id), true);
  }

  async markPaid(id: number, adminId: number) {
    const settings = await this.businessSettings.getRuntime();
    const record = await this.prisma.$transaction(async (tx) => {
      const current = await tx.userWithdrawal.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          netAmount: true,
        },
      });
      if (!current) {
        throw new NotFoundException("Không tìm thấy yêu cầu rút tiền.");
      }

      const changed = await tx.userWithdrawal.updateMany({
        where: { id, status: "processing" },
        data: {
          status: "paid",
          statusReason: null,
          processedById: adminId,
          processedAt: new Date(),
        },
      });
      if (changed.count === 0) {
        throw new ConflictException(
          "Chỉ yêu cầu đang xử lý mới có thể đánh dấu đã thanh toán.",
        );
      }

      await this.referralsService.creditPaidWithdrawal(
        tx,
        current,
        settings.referralCommissionRate,
      );
      return tx.userWithdrawal.findUniqueOrThrow({
        where: { id },
        include: withdrawalInclude,
      });
    });
    return this.toResponse(record, true);
  }

  async reject(id: number, adminId: number, reason: string) {
    return this.refundAndTransition({
      id,
      adminId,
      allowedStatuses: ["pending", "processing"],
      nextStatus: "rejected",
      reason: reason.trim(),
      message:
        "Chỉ yêu cầu đang chờ hoặc đang xử lý mới có thể bị từ chối.",
    });
  }

  private async refundAndTransition(input: {
    id: number;
    userId?: number;
    adminId?: number;
    allowedStatuses: string[];
    nextStatus: "cancelled" | "rejected";
    reason?: string;
    message: string;
  }) {
    const record = await this.prisma.$transaction(async (tx) => {
      const current = await tx.userWithdrawal.findFirst({
        where: {
          id: input.id,
          ...(input.userId ? { userId: input.userId } : {}),
        },
      });
      if (!current) {
        throw new NotFoundException("Không tìm thấy yêu cầu rút tiền.");
      }
      const changed = await tx.userWithdrawal.updateMany({
        where: {
          id: current.id,
          status: { in: input.allowedStatuses },
        },
        data: {
          status: input.nextStatus,
          statusReason: input.reason ?? null,
          ...(input.adminId
            ? {
                processedById: input.adminId,
                processedAt: new Date(),
              }
            : {}),
        },
      });
      if (changed.count === 0) throw new ConflictException(input.message);
      await tx.user.update({
        where: { id: current.userId },
        data: { balance: { increment: current.amount } },
      });
      return tx.userWithdrawal.findUniqueOrThrow({
        where: { id: current.id },
        include: withdrawalInclude,
      });
    });
    return this.toResponse(record, Boolean(input.adminId));
  }

  private async findAvailableAccount(userId: number, id: number) {
    const account = await this.prisma.userPaymentMethod.findFirst({
      where: { id, userId, paymentMethod: { status: "published" } },
      include: {
        paymentMethod: { include: { translations: true } },
      },
    });
    if (!account) {
      throw new BadRequestException(
        "Phương thức nhận tiền không tồn tại hoặc không còn khả dụng.",
      );
    }
    return account;
  }

  private calculateEstimate(
    amount: Prisma.Decimal,
    rawFee: Prisma.Decimal,
    minimum: Prisma.Decimal,
  ) {
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException("Số tiền rút phải lớn hơn 0.");
    }
    if (amount.lessThan(minimum)) {
      throw new BadRequestException(
        `Số tiền rút chưa đạt mức tối thiểu ${minimum.toString()} theo tiền hạch toán.`,
      );
    }
    const fee = Prisma.Decimal.min(amount, rawFee);
    return {
      requestedAmount: amount.toString(),
      feeAmount: fee.toString(),
      netAmount: amount.minus(fee).toString(),
    };
  }

  private parseAmount(value: string) {
    try {
      const amount = new Prisma.Decimal(value);
      if (!amount.isFinite()) throw new Error();
      return amount;
    } catch {
      throw new BadRequestException("Số tiền rút không hợp lệ.");
    }
  }

  private async findRecord(id: number) {
    const record = await this.prisma.userWithdrawal.findUnique({
      where: { id },
      include: withdrawalInclude,
    });
    if (!record) throw new NotFoundException("Không tìm thấy yêu cầu rút tiền.");
    return record;
  }

  private async assertExists(id: number) {
    const exists = await this.prisma.userWithdrawal.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Không tìm thấy yêu cầu rút tiền.");
  }

  private resolveIdempotent(
    record: WithdrawalRecord,
    userId: number,
    dto: CreateWithdrawalDto,
    amount: Prisma.Decimal,
  ) {
    if (
      record.userId !== userId ||
      record.userPaymentMethodId !== dto.userPaymentMethodId ||
      !record.amount.equals(amount)
    ) {
      throw new ConflictException(
        "Idempotency key đã được dùng cho một yêu cầu khác.",
      );
    }
    return this.toResponse(record, false);
  }

  private toResponse(record: WithdrawalRecord, includeDetails: boolean) {
    const snapshot = this.parseSnapshot(record.paymentSnapshotJson);
    const exchangeRate = record.exchangeRate ?? new Prisma.Decimal(1);
    return {
      id: record.id,
      currency: record.currency,
      amount: record.amount.mul(exchangeRate).toString(),
      feeAmount: record.feeAmount.mul(exchangeRate).toString(),
      netAmount: record.netAmount.mul(exchangeRate).toString(),
      status: record.status,
      statusReason: record.statusReason,
      userPaymentMethodId: record.userPaymentMethodId,
      paymentMethod: {
        id: snapshot.paymentMethodId,
        name: snapshot.paymentMethodName,
        details: includeDetails ? snapshot.details : this.maskDetails(snapshot.details),
      },
      user: record.user,
      processedBy: record.processedBy,
      processedAt: record.processedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      canCancel: record.status === "pending",
    };
  }

  private resolveMethodName(
    translations: Array<{ locale: string; name: string | null }>,
  ) {
    return (
      translations.find(({ locale }) => locale === "vi")?.name ||
      translations.find(({ locale }) => locale === "en")?.name ||
      translations.find(({ name }) => name)?.name ||
      "Phương thức thanh toán"
    );
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

  private parseSnapshot(value: string): PaymentSnapshot {
    try {
      const parsed = JSON.parse(value) as Partial<PaymentSnapshot>;
      return {
        paymentMethodId: Number(parsed.paymentMethodId) || 0,
        paymentMethodName:
          typeof parsed.paymentMethodName === "string"
            ? parsed.paymentMethodName
            : "Phương thức thanh toán",
        details:
          parsed.details &&
          typeof parsed.details === "object" &&
          !Array.isArray(parsed.details)
            ? (parsed.details as Record<string, string>)
            : {},
      };
    } catch {
      return {
        paymentMethodId: 0,
        paymentMethodName: "Phương thức thanh toán",
        details: {},
      };
    }
  }

  private maskDetails(details: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(details).map(([key, value]) => [
        key,
        value.length <= 4
          ? "••••"
          : `${"•".repeat(Math.min(8, value.length - 4))} ${value.slice(-4)}`,
      ]),
    );
  }

  private async getWithdrawalCurrency() {
    const settings = await this.businessSettings.getRuntime();
    const currency = await this.prisma.currency.findUnique({
      where: { code: settings.withdrawalCurrencyCode },
      select: { code: true, exchangeRate: true, decimalDigits: true, isActive: true },
    });
    if (!currency?.isActive) {
      throw new ConflictException(
        "Tiền tệ dùng để rút đang bị tắt hoặc không tồn tại.",
      );
    }
    return {
      ...currency,
      maintenanceMode: settings.maintenanceMode,
      withdrawalsPaused: settings.withdrawalsPaused,
    };
  }

  private toBase(
    amount: Prisma.Decimal,
    settlement: { exchangeRate: Prisma.Decimal },
  ) {
    return amount.div(settlement.exchangeRate).toDecimalPlaces(8);
  }

  private fromBase(
    amount: Prisma.Decimal,
    settlement: { exchangeRate: Prisma.Decimal; decimalDigits: number },
  ) {
    return amount
      .mul(settlement.exchangeRate)
      .toDecimalPlaces(settlement.decimalDigits);
  }

  private toSettlementEstimate(
    estimate: {
      requestedAmount: string;
      feeAmount: string;
      netAmount: string;
    },
    settlement: {
      code: string;
      exchangeRate: Prisma.Decimal;
      decimalDigits: number;
    },
  ) {
    return {
      requestedAmount: this.fromBase(
        new Prisma.Decimal(estimate.requestedAmount),
        settlement,
      ).toString(),
      feeAmount: this.fromBase(
        new Prisma.Decimal(estimate.feeAmount),
        settlement,
      ).toString(),
      netAmount: this.fromBase(
        new Prisma.Decimal(estimate.netAmount),
        settlement,
      ).toString(),
    };
  }
}
