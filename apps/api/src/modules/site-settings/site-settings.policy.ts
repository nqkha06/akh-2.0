import { BadRequestException, NotFoundException } from "@nestjs/common";

import type { WebsiteSocialLinkDto } from "./dto/update-website-settings.dto";

export function assertUniqueWebsiteSocialPlatforms(
  links: WebsiteSocialLinkDto[],
) {
  const platforms = links.map((link) => link.platform);
  if (new Set(platforms).size !== platforms.length) {
    throw new BadRequestException(
      "Mỗi nền tảng mạng xã hội chỉ được cấu hình một lần.",
    );
  }
}

export function assertWebsiteBrandingMedia(
  requestedIds: string[],
  files: Array<{ id: string; mimeType: string }>,
) {
  if (files.length !== requestedIds.length) {
    throw new NotFoundException("Có ảnh nhận diện không tồn tại.");
  }
  if (files.some((file) => !file.mimeType.toLowerCase().startsWith("image/"))) {
    throw new BadRequestException(
      "Ảnh nhận diện phải là ảnh còn hoạt động trong Admin Media.",
    );
  }
}
