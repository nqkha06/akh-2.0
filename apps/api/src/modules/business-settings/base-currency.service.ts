import type { Prisma } from "@prisma/client";

import { throwBaseCurrencyInUse } from "./business-settings.policy";
import type { BusinessCurrencyRecord } from "./business-settings.select";

export async function rebaseBusinessCurrency(
  transaction: Prisma.TransactionClient,
  currencies: BusinessCurrencyRecord[],
  nextBaseId: number,
  nextBaseRate: Prisma.Decimal,
) {
  const [withdrawals, commissions, nonZeroBalances] = await Promise.all([
    transaction.userWithdrawal.count(),
    transaction.commission.count(),
    transaction.user.count({ where: { balance: { not: 0 } } }),
  ]);
  if (withdrawals || commissions || nonZeroBalances) {
    throwBaseCurrencyInUse();
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
