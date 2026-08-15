import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type {
  MonetizationRateDto,
  MonetizationRouteDto,
} from "./dto/monetization-level-config.dto";

export function assertMonetizationDefaultPublished(
  isDefault: boolean,
  status: string,
) {
  if (isDefault && status !== "published") {
    throw new BadRequestException(
      "Cấp độ mặc định phải ở trạng thái xuất bản.",
    );
  }
}

export function assertMonetizationDefaultCanBeUnset(
  currentIsDefault: boolean,
  nextIsDefault: boolean | undefined,
) {
  if (currentIsDefault && nextIsDefault === false) {
    throw new BadRequestException(
      "Hãy đặt một cấp độ khác làm mặc định trước khi bỏ cấp độ hiện tại.",
    );
  }
}

export function assertUniqueMonetizationRoutes(routes: MonetizationRouteDto[]) {
  const ids = routes.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException("Route id không được trùng nhau.");
  }
  if (
    routes.some(
      (route) => route.countryMode === "exclude" && route.countryCode === "ALL",
    )
  ) {
    throw new BadRequestException(
      'Route không thể dùng chế độ "exclude" với tất cả quốc gia.',
    );
  }
  if (
    routes.some(
      (route) => route.deviceMode === "exclude" && route.deviceType === "any",
    )
  ) {
    throw new BadRequestException(
      'Route không thể dùng chế độ "exclude" với mọi thiết bị.',
    );
  }
  if (
    routes.some(
      (route) =>
        route.browserMode === "exclude" && route.browserFamily === "any",
    )
  ) {
    throw new BadRequestException(
      'Route không thể dùng chế độ "exclude" với mọi trình duyệt.',
    );
  }
}

export function assertUniqueMonetizationRates(rates: MonetizationRateDto[]) {
  const keys = rates.map(
    ({ countryCode, deviceType }) => `${countryCode}:${deviceType}`,
  );
  if (new Set(keys).size !== keys.length) {
    throw new BadRequestException(
      "Mỗi tổ hợp quốc gia và thiết bị chỉ được có một rate.",
    );
  }
  if (rates.some((rate) => rate.enabled && Number(rate.baseCpm) <= 0)) {
    throw new BadRequestException(
      "Base CPM của rate đang bật phải lớn hơn 0.",
    );
  }
}

export function assertMonetizationLevelCanDelete(level: {
  isDefault: boolean;
  usersCount: number;
}) {
  if (level.isDefault) {
    throw new BadRequestException(
      "Không thể xóa cấp độ mặc định. Hãy chọn cấp độ mặc định khác trước.",
    );
  }
  if (level.usersCount > 0) {
    throw new ConflictException(
      "Cấp độ đang được người dùng lựa chọn. Hãy lưu trữ thay vì xóa.",
    );
  }
}

export function rethrowMonetizationPersistenceError(error: unknown): void {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new ConflictException("Key hoặc locale của cấp độ đã tồn tại.");
  }
}
