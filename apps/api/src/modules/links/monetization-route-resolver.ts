import type { MonetizationRouteDto } from "../monetization-levels/dto/monetization-level-config.dto";
import type { MonetizationAdDto } from "../monetization-levels/dto/monetization-level-config.dto";

export type VisitorRouteContext = {
  countryCode: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browserFamily: "chrome" | "safari" | "firefox" | "edge" | "other";
  operatingSystem?: "android" | "ios" | "windows" | "macos" | "linux" | "other";
  visitorKey: string;
};

export type MonetizationPageContext = {
  siteKey?: string | null;
  deliveryMode?: string | null;
  postType?: string | null;
  categoryIds?: number[];
  niches?: string[];
  locale?: string | null;
  placements?: string[];
  selectionSeed?: string | number;
  adState?: Array<{
    adId: string;
    timestamps: number[];
    sessionCount: number;
  }>;
};

export type ResolvedMonetizationAd = MonetizationAdDto & {
  placement: string;
};

export function buildVisitorRouteContext({
  countryCode,
  userAgent,
  ipAddress,
}: {
  countryCode?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}): VisitorRouteContext {
  const normalizedCountry = normalizeCountryCode(countryCode);
  const normalizedUserAgent = userAgent?.trim() || "unknown";
  const deviceType = detectDeviceType(normalizedUserAgent);
  const browserFamily = detectBrowserFamily(normalizedUserAgent);
  const operatingSystem = detectOperatingSystem(normalizedUserAgent);

  return {
    countryCode: normalizedCountry,
    deviceType,
    browserFamily,
    operatingSystem,
    visitorKey: [
      ipAddress?.trim() || "unknown-ip",
      normalizedUserAgent,
      normalizedCountry,
    ].join("|"),
  };
}

export function resolveMonetizationAds(
  ads: MonetizationAdDto[],
  visitor: VisitorRouteContext,
  page: MonetizationPageContext = {},
): ResolvedMonetizationAd[] {
  const placements = Array.from(
    new Set(page.placements?.length ? page.placements : ["unlock_redirect"]),
  );

  return placements.flatMap((placement) => {
    const smartlinkPlacement =
      placement === "unlock_redirect" || placement === "popunder";
    const matchingAds = ads.filter(
      (ad) =>
        ad.enabled &&
        (ad.format === "smartlink"
          ? smartlinkPlacement
          : !smartlinkPlacement) &&
        ad.placements.includes(placement as MonetizationAdDto["placements"][number]) &&
        matchesList(ad.targeting.countries, visitor.countryCode, ["ALL", "any"]) &&
        matchesList(ad.targeting.devices, visitor.deviceType, ["any"]) &&
        matchesList(ad.targeting.operatingSystems, visitor.operatingSystem ?? "other", ["any"]) &&
        matchesList(ad.targeting.browsers, visitor.browserFamily, ["any"]) &&
        matchesOptionalList(ad.targeting.deliveryModes, page.deliveryMode) &&
        matchesOptionalList(ad.targeting.siteKeys, page.siteKey) &&
        matchesOptionalList(ad.targeting.postTypes, page.postType) &&
        matchesOptionalList(ad.targeting.locales, page.locale) &&
        matchesAny(ad.targeting.categoryIds, page.categoryIds) &&
        matchesAny(ad.targeting.niches, page.niches),
    );
    const candidates = matchingAds
      .flatMap((ad) => expandSmartlinkCandidates(ad))
      .filter((ad) => isWithinDeliveryRules(ad, page));

    if (candidates.length === 0) return [];
    const highestPriority = Math.max(...candidates.map((ad) => ad.priority));
    const prioritized = candidates.filter((ad) => ad.priority === highestPriority);
    const selected =
      prioritized.length === 1
        ? prioritized[0]
        : selectWeightedAd(
            prioritized,
            `${visitor.visitorKey}|${placement}|${page.selectionSeed ?? "stable"}`,
          );
    return selected ? [{ ...selected, placement }] : [];
  });
}

function expandSmartlinkCandidates(ad: MonetizationAdDto): MonetizationAdDto[] {
  if (ad.format !== "smartlink") return [ad];
  const nested = ad.content.smartlinks;
  if (nested !== undefined) {
    const { smartlinks: _smartlinks, targetUrl: _targetUrl, ...campaignContent } =
      ad.content;
    return [...nested]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .filter((smartlink) => smartlink.enabled)
      .map((smartlink) => ({
        ...ad,
        id: smartlink.id,
        weight: smartlink.weight,
        content: {
          ...campaignContent,
          ...smartlink.overrides,
          targetUrl: smartlink.url,
        },
      }));
  }
  return ad.content.targetUrl ? [ad] : [];
}

function isWithinDeliveryRules(
  ad: MonetizationAdDto,
  page: MonetizationPageContext,
) {
  if (ad.format !== "smartlink") return true;
  const now = Date.now();
  const startAt = ad.content.startAt ? Date.parse(ad.content.startAt) : null;
  const endAt = ad.content.endAt ? Date.parse(ad.content.endAt) : null;
  if (startAt !== null && Number.isFinite(startAt) && now < startAt) return false;
  if (endAt !== null && Number.isFinite(endAt) && now >= endAt) return false;

  const state = page.adState?.find((item) => item.adId === ad.id);
  if (!state) return true;
  const maxPerSession = ad.content.maxRedirectsPerSession ?? 0;
  if (maxPerSession > 0 && state.sessionCount >= maxPerSession) return false;

  const timestamps = state.timestamps
    .filter((timestamp) => Number.isSafeInteger(timestamp) && timestamp > 0 && timestamp <= now)
    .sort((left, right) => right - left);
  const cooldownMinutes = ad.content.cooldownMinutes ?? 0;
  if (
    cooldownMinutes > 0 &&
    timestamps[0] !== undefined &&
    now - timestamps[0] < cooldownMinutes * 60_000
  ) {
    return false;
  }

  const maxPerVisitor = ad.content.maxRedirectsPerVisitor ?? 0;
  if (maxPerVisitor <= 0) return true;
  const windowHours = ad.content.frequencyWindowHours ?? 24;
  const windowStart = now - windowHours * 3_600_000;
  return timestamps.filter((timestamp) => timestamp >= windowStart).length < maxPerVisitor;
}

export function resolveMonetizationRoute(
  routes: MonetizationRouteDto[],
  context: VisitorRouteContext,
): MonetizationRouteDto | null {
  const candidates = routes.filter(
    (route) =>
      route.enabled &&
      matchesDimension(
        route.countryMode,
        context.countryCode,
        route.countryCode,
        "ALL",
      ) &&
      matchesDimension(
        route.deviceMode,
        context.deviceType,
        route.deviceType,
        "any",
      ) &&
      matchesDimension(
        route.browserMode,
        context.browserFamily,
        route.browserFamily,
        "any",
      ),
  );

  if (candidates.length === 0) return null;

  const highestPriority = Math.max(
    ...candidates.map((route) => route.priority),
  );
  const prioritized = candidates.filter(
    (route) => route.priority === highestPriority,
  );

  if (prioritized.length === 1) return prioritized[0] ?? null;

  return selectWeightedRoute(prioritized, context.visitorKey);
}

export function detectDeviceType(
  userAgent: string,
): VisitorRouteContext["deviceType"] {
  const value = userAgent.toLowerCase();
  const isTablet =
    /ipad|tablet|kindle|silk/.test(value) ||
    (/android/.test(value) && !/mobile/.test(value));

  if (isTablet) return "tablet";
  if (/mobile|iphone|ipod|android|windows phone/.test(value)) return "mobile";
  return "desktop";
}

export function detectBrowserFamily(
  userAgent: string,
): VisitorRouteContext["browserFamily"] {
  const value = userAgent.toLowerCase();

  if (/edg(?:e|a|ios)?\//.test(value)) return "edge";
  if (/firefox\/|fxios\//.test(value)) return "firefox";
  if (/chrome\/|crios\/|chromium\//.test(value)) return "chrome";
  if (/safari\//.test(value) && /version\//.test(value)) return "safari";
  return "other";
}

export function detectOperatingSystem(
  userAgent: string,
): NonNullable<VisitorRouteContext["operatingSystem"]> {
  const value = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(value)) return "ios";
  if (/android/.test(value)) return "android";
  if (/windows nt/.test(value)) return "windows";
  if (/macintosh|mac os x/.test(value)) return "macos";
  if (/linux/.test(value)) return "linux";
  return "other";
}

function matchesDimension(
  mode: MonetizationRouteDto["countryMode"],
  actual: string,
  expected: string,
  wildcard: string,
) {
  const normalizedMode = mode === "exclude" ? "exclude" : "include";

  if (normalizedMode === "exclude") {
    return expected !== wildcard && actual !== expected;
  }

  return expected === wildcard || actual === expected;
}

function selectWeightedRoute(
  routes: MonetizationRouteDto[],
  visitorKey: string,
) {
  const totalWeight = routes.reduce(
    (total, route) => total + Math.max(1, route.weight),
    0,
  );
  let bucket = stableHash(visitorKey) % totalWeight;

  for (const route of routes) {
    bucket -= Math.max(1, route.weight);
    if (bucket < 0) return route;
  }

  return routes[routes.length - 1] ?? null;
}

function selectWeightedAd(ads: MonetizationAdDto[], visitorKey: string) {
  const totalWeight = ads.reduce((total, ad) => total + Math.max(1, ad.weight), 0);
  let bucket = stableHash(visitorKey) % totalWeight;
  for (const ad of ads) {
    bucket -= Math.max(1, ad.weight);
    if (bucket < 0) return ad;
  }
  return ads[ads.length - 1] ?? null;
}

function matchesList<T extends string>(values: T[], actual: string, wildcards: string[]) {
  if (!values.length) return true;
  const normalized = values.map((value) => value.toLowerCase());
  return wildcards.some((value) => normalized.includes(value.toLowerCase())) || normalized.includes(actual.toLowerCase());
}

function matchesOptionalList(values: string[] | undefined, actual?: string | null) {
  if (!values?.length || values.some((value) => value.toLowerCase() === "any")) return true;
  if (!actual) return false;
  return values.some((value) => value.toLowerCase() === actual.toLowerCase());
}

function matchesAny<T extends string | number>(expected: T[], actual?: T[]) {
  if (!expected.length || expected.some((value) => String(value).toLowerCase() === "any")) return true;
  if (!actual?.length) return false;
  const values = new Set(actual.map((value) => String(value).toLowerCase()));
  return expected.some((value) => values.has(String(value).toLowerCase()));
}

function stableHash(value: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function normalizeCountryCode(value?: string | null) {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : "ZZ";
}
