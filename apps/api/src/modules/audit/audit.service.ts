import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

export type AuditRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditInput = AuditRequestContext & {
  actorUserId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  previousData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditInput, transaction?: Prisma.TransactionClient) {
    const client = transaction ?? this.prisma;
    return client.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId:
          input.resourceId === undefined || input.resourceId === null
            ? null
            : String(input.resourceId),
        previousData: input.previousData ?? Prisma.JsonNull,
        newData: input.newData ?? Prisma.JsonNull,
        ipAddress: input.ipAddress?.slice(0, 128) || null,
        userAgent: input.userAgent?.slice(0, 1_000) || null,
      },
    });
  }
}
