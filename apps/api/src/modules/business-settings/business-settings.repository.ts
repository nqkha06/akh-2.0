import { Injectable } from "@nestjs/common";
import { Prisma, type PrismaClient } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

type DatabaseClient = PrismaService | Prisma.TransactionClient | PrismaClient;

@Injectable()
export class BusinessSettingsRepository {
  private readonly singletonId = 1;

  constructor(private readonly prisma: PrismaService) {}

  async find(client: DatabaseClient = this.prisma) {
    const existing = await client.businessSettings.findUnique({
      where: { id: this.singletonId },
    });
    if (existing) return existing;
    try {
      return await client.businessSettings.create({
        data: {
          id: this.singletonId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return client.businessSettings.findUniqueOrThrow({
          where: { id: this.singletonId },
        });
      }
      throw error;
    }
  }

  async update(
    client: Prisma.TransactionClient,
    expectedVersion: number,
    data: Prisma.BusinessSettingsUncheckedUpdateInput,
  ) {
    const changed = await client.businessSettings.updateMany({
      where: { id: this.singletonId, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (changed.count !== 1) return null;
    return client.businessSettings.findUniqueOrThrow({
      where: { id: this.singletonId },
    });
  }
}
