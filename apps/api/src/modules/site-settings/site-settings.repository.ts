import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { WEBSITE_SETTINGS_INCLUDE } from "./site-settings.select";

@Injectable()
export class SiteSettingsRepository {
  private readonly singletonId = 1;

  constructor(private readonly prisma: PrismaService) {}

  findOrCreate() {
    return this.prisma.websiteSettings.upsert({
      where: { id: this.singletonId },
      create: { id: this.singletonId },
      update: {},
      include: WEBSITE_SETTINGS_INCLUDE,
    });
  }

  update(
    data: Prisma.WebsiteSettingsUncheckedCreateInput,
  ) {
    const { id: _id, ...values } = data;
    return this.prisma.websiteSettings.upsert({
      where: { id: this.singletonId },
      create: { id: this.singletonId, ...values },
      update: values,
      include: WEBSITE_SETTINGS_INCLUDE,
    });
  }
}
