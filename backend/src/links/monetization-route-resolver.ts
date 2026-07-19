import type { MonetizationRouteDto } from "../monetization-levels/dto/monetization-level-config.dto";

export type VisitorRouteContext = {
  countryCode: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browserFamily: "chrome" | "safari" | "firefox" | "edge" | "other";
  visitorKey: string;
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

  return {
    countryCode: normalizedCountry,
    deviceType,
    browserFamily,
    visitorKey: [
      ipAddress?.trim() || "unknown-ip",
      normalizedUserAgent,
      normalizedCountry,
    ].join("|"),
  };
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
