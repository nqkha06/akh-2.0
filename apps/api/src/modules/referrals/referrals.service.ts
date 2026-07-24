import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { PrismaService } from "../../database/prisma/prisma.service";

export const REFERRAL_COMMISSION_RATE = new Prisma.Decimal("5.00");
export const REFERRAL_COMMISSIONABLE_TYPE = "user_withdrawal";

type PaidWithdrawalSource = {
  id: number;
  userId: number;
  netAmount: Prisma.Decimal;
};

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberDashboard(userId: number) {
    const referralCode = await this.ensureReferralCode(userId);
    const [
      referrals,
      referralCount,
      commissionSummary,
      commissionCount,
      recentCommissions,
    ] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where: { referredById: userId },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            createdAt: true,
            commissionsGenerated: {
              where: {
                userId,
                commissionableType: REFERRAL_COMMISSIONABLE_TYPE,
              },
              orderBy: { createdAt: "desc" },
              select: {
                amount: true,
                createdAt: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where: { referredById: userId } }),
        this.prisma.commission.aggregate({
          where: {
            userId,
            commissionableType: REFERRAL_COMMISSIONABLE_TYPE,
          },
          _sum: { amount: true },
        }),
        this.prisma.commission.count({
          where: {
            userId,
            commissionableType: REFERRAL_COMMISSIONABLE_TYPE,
          },
        }),
        this.prisma.commission.findMany({
          where: {
            userId,
            commissionableType: REFERRAL_COMMISSIONABLE_TYPE,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amount: true,
            rate: true,
            commissionableId: true,
            createdAt: true,
            fromUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        }),
      ]);

    return {
      referralCode,
      referralPath: `/register?ref=${encodeURIComponent(referralCode)}`,
      currency: "VND",
      commissionRate: REFERRAL_COMMISSION_RATE.toFixed(2),
      commissionBasis: "net_amount",
      summary: {
        totalReferrals: referralCount,
        totalCommission: (
          commissionSummary._sum.amount ?? new Prisma.Decimal(0)
        ).toString(),
        successfulWithdrawals: commissionCount,
      },
      referrals: referrals.map((referral) => {
        const totalCommission = referral.commissionsGenerated.reduce(
          (total, commission) => total.plus(commission.amount),
          new Prisma.Decimal(0),
        );
        return {
          id: referral.id,
          name: referral.name,
          maskedEmail: this.maskEmail(referral.email),
          avatar: referral.avatar,
          status: referral.status,
          joinedAt: referral.createdAt.toISOString(),
          successfulWithdrawals: referral.commissionsGenerated.length,
          lastCommissionAt:
            referral.commissionsGenerated[0]?.createdAt.toISOString() ?? null,
          totalCommission: totalCommission.toString(),
        };
      }),
      recentCommissions: recentCommissions.map((commission) => ({
        id: commission.id,
        amount: commission.amount.toString(),
        rate: commission.rate.toString(),
        withdrawalId: commission.commissionableId,
        createdAt: commission.createdAt.toISOString(),
        fromUser: {
          id: commission.fromUser.id,
          name: commission.fromUser.name,
          maskedEmail: this.maskEmail(commission.fromUser.email),
          avatar: commission.fromUser.avatar,
        },
      })),
    };
  }

  async creditPaidWithdrawal(
    tx: Prisma.TransactionClient,
    withdrawal: PaidWithdrawalSource,
  ) {
    const source = await tx.user.findUnique({
      where: { id: withdrawal.userId },
      select: { referredById: true },
    });
    const referrerId = source?.referredById;
    if (!referrerId || referrerId === withdrawal.userId) return null;

    const amount = withdrawal.netAmount
      .mul(REFERRAL_COMMISSION_RATE)
      .div(100)
      .toDecimalPlaces(2);
    if (amount.lessThanOrEqualTo(0)) return null;

    const commission = await tx.commission.create({
      data: {
        userId: referrerId,
        fromUserId: withdrawal.userId,
        amount,
        rate: REFERRAL_COMMISSION_RATE,
        commissionableType: REFERRAL_COMMISSIONABLE_TYPE,
        commissionableId: withdrawal.id,
        note: `Hoa hồng từ withdrawal #${withdrawal.id}`,
      },
    });
    await tx.user.update({
      where: { id: referrerId },
      data: { balance: { increment: amount } },
    });
    return commission;
  }

  private async ensureReferralCode(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) throw new NotFoundException("Không tìm thấy người dùng.");
    if (user.referralCode) return user.referralCode;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const referralCode = this.generateReferralCode();
      try {
        const updated = await this.prisma.user.updateMany({
          where: { id: userId, referralCode: null },
          data: { referralCode },
        });
        if (updated.count === 1) return referralCode;

        const current = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { referralCode: true },
        });
        if (current?.referralCode) return current.referralCode;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new ServiceUnavailableException(
      "Không thể tạo mã giới thiệu lúc này.",
    );
  }

  private generateReferralCode() {
    return randomBytes(6).toString("hex");
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split("@");
    if (!domain) return "***";
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
  }
}
