import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { UpdateWebsiteSettingsDto } from "./dto/update-website-settings.dto";
import {
  buildWebsiteSettingsPersistence,
  mapAdminWebsiteSettings,
  mapPublicWebsiteSettings,
} from "./site-settings.mapper";
import {
  assertUniqueWebsiteSocialPlatforms,
  assertWebsiteBrandingMedia,
} from "./site-settings.policy";
import { SiteSettingsRepository } from "./site-settings.repository";

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SiteSettingsRepository,
  ) {}

  async getAdminSettings() {
    return mapAdminWebsiteSettings(await this.repository.findOrCreate());
  }

  async getPublicSettings() {
    return mapPublicWebsiteSettings(await this.repository.findOrCreate());
  }

  async update(dto: UpdateWebsiteSettingsDto, adminId: number) {
    assertUniqueWebsiteSocialPlatforms(dto.socialLinks);
    await this.validateMediaIds([
      dto.logoLightId,
      dto.logoDarkId,
      dto.logoIconId,
      dto.faviconId,
      dto.defaultOgImageId,
    ]);

    const settings = await this.repository.update({
      id: 1,
      ...buildWebsiteSettingsPersistence(dto),
      updatedById: adminId,
    });
    return mapAdminWebsiteSettings(settings);
  }

  private async validateMediaIds(ids: Array<string | null | undefined>) {
    const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (uniqueIds.length === 0) return;
    const files = await this.prisma.adminMedia.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: { id: true, mimeType: true },
    });
    assertWebsiteBrandingMedia(uniqueIds, files);
  }
}
