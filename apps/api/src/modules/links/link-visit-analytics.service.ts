import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DEVICE_TYPE_CODES } from "@stu/contracts";
import { createHash } from "node:crypto";

import type {
  MonetizationMetaDataDto,
  MonetizationRateDto,
} from "../monetization-levels/dto/monetization-level-config.dto";
import type {
  LinkVisitorMetadata,
  ResolvedMonetization,
} from "./links.service";
import type { VisitorRouteContext } from "./monetization-route-resolver";

const DEFAULT_META: MonetizationMetaDataDto = {
  version: 1,
  profitBps: 0,
  stepCount: 1,
  visitorExperience: {
    popup: "none",
    banner: "none",
    interstitial: "none",
    notification: "none",
  },
};

@Injectable()
export class LinkVisitAnalyticsService {
  async createIntent(
    prisma: Prisma.TransactionClient,
    link: { id: number; userId: number },
    monetization: ResolvedMonetization | null,
    visitor: LinkVisitorMetadata,
    context: VisitorRouteContext,
  ) {
    const rawUserAgent = visitor.userAgent?.trim() || "unknown";
    const agentHash = createHash("md5").update(rawUserAgent).digest("hex");
    const device = this.deviceCode(context.deviceType);
    const rate = this.selectRate(
      this.parseJson<MonetizationRateDto[]>(
        monetization?.ratesJson ?? "[]",
        [],
      ),
      context,
    );
    const meta = this.parseJson<MonetizationMetaDataDto>(
      monetization?.metaDataJson ?? "{}",
      DEFAULT_META,
    );
    const profitBps = Number.isInteger(meta.profitBps)
      ? Math.min(10_000, Math.max(0, meta.profitBps))
      : 0;
    const payoutCpm = await this.payoutCpmInBaseCurrency(
      prisma,
      rate,
      profitBps,
    );

    await prisma.userAgent.upsert({
      where: { hash: agentHash },
      create: {
        hash: agentHash,
        raw: rawUserAgent,
        browser: context.browserFamily,
        os: this.detectOperatingSystem(rawUserAgent),
        deviceType: device,
      },
      update: {
        raw: rawUserAgent,
        browser: context.browserFamily,
        os: this.detectOperatingSystem(rawUserAgent),
        deviceType: device,
      },
    });

    return prisma.linkAccessLog.create({
      data: {
        linkId: link.id,
        userId: link.userId,
        levelId: monetization?.levelId ?? null,
        agentHash,
        ipAddress: this.normalizeIpAddress(visitor.ipAddress),
        country: context.countryCode,
        device,
        referrer: this.normalizeReferrer(visitor.referrer),
        payoutCpm,
      },
      select: { id: true },
    });
  }

  async completeIntent(
    prisma: Prisma.TransactionClient,
    slug: string,
    visitToken: string,
  ) {
    const intent = await prisma.linkAccessLog.findFirst({
      where: {
        id: visitToken,
        link: { slug, deletedAt: null },
      },
      select: {
        id: true,
        completedAt: true,
      },
    });

    if (!intent) {
      throw new NotFoundException("Visit không tồn tại hoặc không thuộc link.");
    }

    if (!intent.completedAt) {
      await prisma.linkAccessLog.update({
        where: { id: intent.id },
        data: { completedAt: new Date() },
      });
    }
  }

  private selectRate(
    rates: MonetizationRateDto[],
    context: VisitorRouteContext,
  ) {
    return rates
      .filter(
        (rate) =>
          rate.enabled &&
          (rate.countryCode === context.countryCode ||
            rate.countryCode === "ALL" ||
            (context.countryCode === "ZZ" && rate.countryCode === "ZZ")) &&
          (rate.deviceType === context.deviceType ||
            rate.deviceType === "any"),
      )
      .sort((left, right) => {
        const leftScore =
          (left.countryCode === context.countryCode ? 2 : 0) +
          (left.deviceType === context.deviceType ? 1 : 0);
        const rightScore =
          (right.countryCode === context.countryCode ? 2 : 0) +
          (right.deviceType === context.deviceType ? 1 : 0);
        return rightScore - leftScore;
      })[0];
  }

  private async payoutCpmInBaseCurrency(
    prisma: Prisma.TransactionClient,
    rate: MonetizationRateDto | undefined,
    profitBps: number,
  ) {
    if (!rate || profitBps <= 0) return new Prisma.Decimal(0);

    const currency = await prisma.currency.findUnique({
      where: { code: rate.currency },
      select: { exchangeRate: true },
    });
    if (!currency || currency.exchangeRate.lessThanOrEqualTo(0)) {
      return new Prisma.Decimal(0);
    }

    return new Prisma.Decimal(rate.baseCpm)
      .mul(profitBps)
      .div(10_000)
      .div(currency.exchangeRate);
  }

  private deviceCode(deviceType: VisitorRouteContext["deviceType"]) {
    return DEVICE_TYPE_CODES[deviceType];
  }

  private detectOperatingSystem(userAgent: string) {
    const value = userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(value)) return "ios";
    if (/android/.test(value)) return "android";
    if (/windows nt/.test(value)) return "windows";
    if (/macintosh|mac os x/.test(value)) return "macos";
    if (/linux/.test(value)) return "linux";
    return "other";
  }

  private normalizeIpAddress(value?: string | null) {
    const normalized = value?.split(",")[0]?.trim();
    return normalized ? normalized.slice(0, 45) : null;
  }

  private normalizeReferrer(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized.slice(0, 2_048) : "direct";
  }

  private parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
}
