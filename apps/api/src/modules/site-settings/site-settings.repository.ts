import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class SiteSettingsRepository {
  private readonly singletonId = 1;

  constructor(private readonly prisma: PrismaService) {}

  findOrCreate(include: Prisma.WebsiteSettingsInclude) {
    return this.prisma.websiteSettings.upsert({
      where: { id: this.singletonId },
      create: { id: this.singletonId },
      update: {},
      include,
    });
  }

  update(
    data: Prisma.WebsiteSettingsUncheckedCreateInput,
    include: Prisma.WebsiteSettingsInclude,
  ) {
    const { id: _id, ...values } = data;
    return this.prisma.websiteSettings.upsert({
      where: { id: this.singletonId },
      create: { id: this.singletonId, ...values },
      update: values,
      include,
    });
  }
}
