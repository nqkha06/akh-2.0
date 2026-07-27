import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NestFactory, Reflector } from "@nestjs/core";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import type { PrismaService } from "../src/database/prisma/prisma.service";
import { PermissionsGuard } from "../src/modules/auth/guards/permissions.guard";
import { RolesGuard } from "../src/modules/auth/guards/roles.guard";
import { LinkAccessAggregationWorker } from "../src/modules/links/link-access-aggregation.worker";
import { resolveMonetizationRoute } from "../src/modules/links/monetization-route-resolver";
import type { MonetizationRouteDto } from "../src/modules/monetization-levels/dto/monetization-level-config.dto";

type JwtBody = {
  sub: number;
  sid: string;
  rot?: number;
  email?: string;
  role?: string;
  type: "access" | "refresh";
  exp?: number;
  iat?: number;
};

type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: number;
  user: Record<string, unknown>;
};

const testDatabaseName = `auth-test-${process.pid}.db`;
const testDatabasePath = join(process.cwd(), "prisma", testDatabaseName);
const adminMediaTestPath = join(
  process.cwd(),
  "uploads",
  `admin-media-test-${process.pid}`,
);
const memberFilesTestPath = join(
  process.cwd(),
  "uploads",
  `member-files-test-${process.pid}`,
);
process.env.DATABASE_URL = `file:./${testDatabaseName}`;
process.env.ADMIN_MEDIA_UPLOAD_DIR = adminMediaTestPath;
process.env.MEMBER_FILES_UPLOAD_DIR = memberFilesTestPath;
process.env.MEMBER_STORAGE_LIMIT_BYTES = String(1024 * 1024);
process.env.JWT_ACCESS_SECRET =
  "test-access-secret-that-is-longer-than-thirty-two-characters";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-that-is-different-and-long-enough";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.AUTH_COOKIE_SECURE = "false";
process.env.AUTH_COOKIE_SAME_SITE = "lax";
process.env.QUEUE_ENABLED = "false";
process.env.VISIT_AGGREGATION_DISABLED = "true";

let app!: INestApplication;
let baseUrl!: string;
let prisma!: PrismaService;
let jwtService!: JwtService;
let adminAccessToken = "";
let requestSequence = 0;

function decodeJwt(token: string) {
  const body = token.split(".")[1];
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as JwtBody;
}

function refreshCookie(response: Response) {
  return authCookie(response, "stu_refresh_token");
}

function accessCookie(response: Response) {
  return authCookie(response, "stu_access_token");
}

function authCookie(response: Response, name: string) {
  const match = new RegExp(`${name}=([^;]+)`).exec(
    response.headers.get("set-cookie") || "",
  );
  assert.ok(match, `response must set the ${name} cookie`);
  return `${name}=${match[1]}`;
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("X-Forwarded-For")) {
    requestSequence += 1;
    headers.set(
      "X-Forwarded-For",
      `198.51.${Math.floor(requestSequence / 250)}.${(requestSequence % 250) + 1}`,
    );
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
}

async function login() {
  return loginAs("auth@example.com", "Secure123");
}

async function loginAs(email: string, password: string, forwardedFor?: string) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: forwardedFor ? { "X-Forwarded-For": forwardedFor } : undefined,
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as AuthResponse;
  return { response, body, cookie: refreshCookie(response) };
}

before(async () => {
  execFileSync(
    join(process.cwd(), "node_modules/.bin/prisma"),
    ["db", "push", "--skip-generate"],
    { env: { ...process.env, RUST_LOG: "info" } },
  );

  const [{ AppModule }, prismaModule] = await Promise.all([
    import("../src/app.module"),
    import("../src/database/prisma/prisma.service"),
  ]);
  app = await NestFactory.create(AppModule, { logger: false });
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  prisma = app.get(prismaModule.PrismaService);
  jwtService = app.get(JwtService);
});

after(async () => {
  await app?.close();
  rmSync(testDatabasePath, { force: true });
  rmSync(adminMediaTestPath, { force: true, recursive: true });
  rmSync(memberFilesTestPath, { force: true, recursive: true });
});

describe("Authentication E2E", () => {
  it("registers an account without returning sensitive fields", async () => {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Auth Test",
        email: "auth@example.com",
        password: "Secure123",
      }),
    });
    assert.equal(response.status, 201);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.email, "auth@example.com");
    assert.equal("passwordHash" in body, false);
    assert.equal("refreshTokenHash" in body, false);
  });

  it("rejects duplicate registration", async () => {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate",
        email: "AUTH@example.com",
        password: "Secure123",
      }),
    });
    assert.equal(response.status, 409);
  });

  it("logs in with the correct password and rejects a wrong password", async () => {
    const valid = await login();
    assert.ok(valid.body.accessToken);
    assert.ok(valid.body.accessTokenExpiresAt > Date.now());
    assert.equal("passwordHash" in valid.body.user, false);
    const setCookie = valid.response.headers.get("set-cookie") || "";
    assert.match(setCookie, /stu_access_token=[^;]+/);
    assert.match(setCookie, /stu_refresh_token=[^;]+/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Path=\//i);

    const invalid = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "auth@example.com", password: "Wrong123" }),
    });
    assert.equal(invalid.status, 401);
    const body = (await invalid.json()) as { message: string };
    assert.equal(body.message, "Email hoặc mật khẩu không chính xác.");
  });

  it("blocks a locked account", async () => {
    await prisma.user.update({
      where: { email: "auth@example.com" },
      data: { status: "locked" },
    });
    const response = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "auth@example.com",
        password: "Secure123",
      }),
    });
    assert.equal(response.status, 401);
    await prisma.user.update({
      where: { email: "auth@example.com" },
      data: { status: "active" },
    });
  });

  it("accepts access tokens from bearer headers and HttpOnly cookies", async () => {
    const current = await login();
    const me = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${current.body.accessToken}` },
    });
    assert.equal(me.status, 200);
    const user = (await me.json()) as Record<string, unknown>;
    assert.equal("passwordHash" in user, false);
    assert.equal(
      (
        await request("/api/auth/me", {
          headers: { Cookie: accessCookie(current.response) },
        })
      ).status,
      200,
    );
    assert.equal((await request("/api/auth/me")).status, 401);

    const payload = decodeJwt(current.body.accessToken);
    delete payload.exp;
    delete payload.iat;
    const expired = await jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: -1,
    });
    const expiredResponse = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${expired}` },
    });
    assert.equal(expiredResponse.status, 401);
    assert.equal(
      ((await expiredResponse.json()) as { code: string }).code,
      "ACCESS_TOKEN_EXPIRED",
    );
  });

  it("rotates a refresh token exactly once", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    const refreshed = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(refreshed.status, 200);
    const rotatedCookie = refreshCookie(refreshed);
    assert.notEqual(rotatedCookie, current.cookie);

    const session = await prisma.authSession.findUniqueOrThrow({
      where: { id: payload.sid },
    });
    assert.equal(session.rotationCounter, 1);
    assert.equal(session.revokedAt, null);
  });

  it("accepts only one of 20 concurrent refresh requests", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: current.cookie },
        }),
      ),
    );

    assert.equal(
      responses.filter((response) => response.status === 200).length,
      1,
    );
    assert.equal(
      responses.filter((response) => response.status === 401).length,
      19,
    );

    const session = await prisma.authSession.findUniqueOrThrow({
      where: { id: payload.sid },
    });
    assert.equal(session.rotationCounter, 1);
    assert.ok(session.revokedAt);
  });

  it("immediately treats a rotated token as reuse and revokes the session", async () => {
    const current = await login();
    const first = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(first.status, 200);
    const rotatedCookie = refreshCookie(first);
    const payload = decodeJwt(current.cookie.split("=")[1]);

    const reuse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(reuse.status, 401);
    assert.equal(
      ((await reuse.json()) as { code: string }).code,
      "REFRESH_TOKEN_REUSE_DETECTED",
    );

    const session = await prisma.authSession.findUniqueOrThrow({
      where: { id: payload.sid },
    });
    assert.equal(session.rotationCounter, 1);
    assert.ok(session.revokedAt);

    const rotatedAfterReuse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(rotatedAfterReuse.status, 401);
    assert.equal(
      ((await rotatedAfterReuse.json()) as { code: string }).code,
      "SESSION_REVOKED",
    );
  });

  it("rejects expired, malformed and revoked refresh tokens", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    delete payload.exp;
    delete payload.iat;
    const expired = await jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: -1,
    });
    const expiredResponse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: `stu_refresh_token=${expired}` },
    });
    assert.equal(expiredResponse.status, 401);
    assert.equal(
      ((await expiredResponse.json()) as { code: string }).code,
      "REFRESH_TOKEN_EXPIRED",
    );

    const malformedResponse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: "stu_refresh_token=not-a-jwt" },
    });
    assert.equal(malformedResponse.status, 401);
    assert.equal(
      ((await malformedResponse.json()) as { code: string }).code,
      "REFRESH_TOKEN_INVALID",
    );

    await prisma.authSession.update({
      where: { id: payload.sid },
      data: { revokedAt: new Date() },
    });
    const revokedResponse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(revokedResponse.status, 401);
    assert.equal(
      ((await revokedResponse.json()) as { code: string }).code,
      "SESSION_REVOKED",
    );
  });

  it("logout is idempotent and invalidates the current session", async () => {
    const current = await login();
    const logoutResponse = await request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(logoutResponse.status, 204);
    const clearedCookies = logoutResponse.headers.get("set-cookie") || "";
    assert.match(clearedCookies, /stu_access_token=;/);
    assert.match(clearedCookies, /stu_refresh_token=;/);
    assert.equal(
      (await request("/api/auth/logout", { method: "POST" })).status,
      204,
    );
    assert.equal(
      (
        await request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: current.cookie },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/me", {
          headers: { Authorization: `Bearer ${current.body.accessToken}` },
        })
      ).status,
      401,
    );
  });

});

describe("Member dashboard E2E", () => {
  it("requires authentication and returns a simple real-data overview", async () => {
    assert.equal((await request("/api/member/dashboard")).status, 401);

    const member = await login();
    const response = await request("/api/member/dashboard", {
      headers: { Authorization: `Bearer ${member.body.accessToken}` },
    });
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      member: { name: string; balance: string };
      analytics: {
        periodDays: number;
        metrics: {
          revenue: number;
          successfulOpens: number;
          earnedViews: number;
          averageCpm: number;
        };
        today: {
          revenue: number;
          successfulOpens: number;
          earnedViews: number;
          averageCpm: number;
        };
        series: unknown[];
        breakdowns: {
          countries: unknown[];
          devices: unknown[];
          browsers: unknown[];
        };
        topLinks: unknown[];
      };
    };
    assert.equal(body.member.name, "Auth Test");
    assert.equal(body.member.balance, "0");
    assert.equal(body.analytics.periodDays, 30);
    assert.equal(typeof body.analytics.metrics.successfulOpens, "number");
    assert.equal(typeof body.analytics.metrics.revenue, "number");
    assert.equal(typeof body.analytics.today.successfulOpens, "number");
    assert.equal(body.analytics.series.length, 30);
    assert.ok(Array.isArray(body.analytics.breakdowns.countries));
    assert.ok(Array.isArray(body.analytics.breakdowns.devices));
    assert.ok(Array.isArray(body.analytics.breakdowns.browsers));
    assert.ok(Array.isArray(body.analytics.topLinks));

    for (const [range, days] of [
      ["today", 1],
      ["yesterday", 1],
      ["7d", 7],
      ["30d", 30],
      ["60d", 60],
      ["90d", 90],
    ] as const) {
      const rangeResponse = await request(
        `/api/member/dashboard?range=${range}`,
        {
          headers: { Authorization: `Bearer ${member.body.accessToken}` },
        },
      );
      assert.equal(rangeResponse.status, 200);
      const rangeBody = (await rangeResponse.json()) as {
        analytics: { periodDays: number; series: unknown[] };
      };
      assert.equal(rangeBody.analytics.periodDays, days);
      assert.equal(rangeBody.analytics.series.length, days);
    }

    assert.equal(
      (
        await request("/api/member/dashboard?range=invalid", {
          headers: { Authorization: `Bearer ${member.body.accessToken}` },
        })
      ).status,
      400,
    );
  });
});

describe("Member loyalty E2E", () => {
  it("returns localized tiers, check/X states, and progress from earned visits", async () => {
    assert.equal((await request("/api/member/loyalty")).status, 401);

    const email = `loyalty-${process.pid}@example.com`;
    const password = "Secure123";
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: "Loyalty Member", email, password }),
        })
      ).status,
      201,
    );
    const member = await loginAs(email, password);
    const authorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    for (const tier of [
      { key: "started", minimum: 0, order: 10, vi: "Khởi đầu", en: "Starter" },
      { key: "bronze", minimum: 2, order: 20, vi: "Đồng", en: "Bronze" },
      { key: "gold", minimum: 5, order: 30, vi: "Vàng", en: "Gold" },
    ]) {
      await prisma.loyaltyTier.create({
        data: {
          key: tier.key,
          minimumValidViews: tier.minimum,
          sortOrder: tier.order,
          iconKey: tier.key === "gold" ? "trophy" : "sparkles",
          status: "published",
          translations: {
            create: [
              {
                locale: "vi",
                name: tier.vi,
                benefitsJson: JSON.stringify([
                  {
                    key: "csv_export",
                    label: "Xuất báo cáo CSV",
                    included: tier.key === "gold",
                    value: null,
                  },
                ]),
              },
              {
                locale: "en",
                name: tier.en,
                benefitsJson: JSON.stringify([
                  {
                    key: "csv_export",
                    label: "CSV report export",
                    included: tier.key === "gold",
                    value: null,
                  },
                ]),
              },
            ],
          },
        },
      });
    }

    const link = await prisma.link.create({
      data: {
        userId: user.id,
        slug: `loyalty-${process.pid}`,
        title: "Loyalty source",
        destinationUrl: "https://example.com/loyalty",
      },
    });
    const agentHash = `loyalty-agent-${process.pid}`;
    await prisma.userAgent.create({
      data: {
        hash: agentHash,
        raw: "Loyalty E2E",
        browser: "test",
        os: "test",
        deviceType: 1,
      },
    });
    const now = new Date();
    await prisma.linkAccessLog.createMany({
      data: Array.from({ length: 4 }, (_, index) => ({
        id: `loyalty-access-${process.pid}-${index}`,
        linkId: link.id,
        userId: user.id,
        agentHash,
        ipAddress: `203.0.113.${index + 1}`,
        country: "VN",
        device: 1,
        payoutCpm: "1",
        revenue: index < 3 ? "0.001" : "0",
        isEarn: index < 3,
        completedAt: now,
        processedAt: now,
      })),
    });

    const response = await request("/api/member/loyalty?locale=en-US", {
      headers: authorization,
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      calculation: { windowDays: number; lastAggregatedAt: string | null };
      summary: {
        currentValue: number;
        currentTier: { key: string; name: string };
        nextTier: { key: string; name: string };
        nextTierTarget: number;
        remaining: number;
        progress: number;
      };
      tiers: Array<{
        key: string;
        name: string;
        isCurrent: boolean;
        isNext: boolean;
        benefits: Array<{ key: string; included: boolean }>;
      }>;
      history: Array<{
        dailyValidViews: number;
        rollingValidViews: number;
        tier: { key: string; name: string } | null;
      }>;
    };

    assert.equal(body.calculation.windowDays, 7);
    assert.ok(body.calculation.lastAggregatedAt);
    assert.equal(body.summary.currentValue, 3);
    assert.deepEqual(body.summary.currentTier, {
      key: "bronze",
      name: "Bronze",
    });
    assert.deepEqual(body.summary.nextTier, { key: "gold", name: "Gold" });
    assert.equal(body.summary.nextTierTarget, 5);
    assert.equal(body.summary.remaining, 2);
    assert.equal(body.summary.progress, 33);
    assert.equal(body.tiers.find((tier) => tier.key === "bronze")?.isCurrent, true);
    assert.equal(body.tiers.find((tier) => tier.key === "gold")?.isNext, true);
    assert.equal(
      body.tiers.find((tier) => tier.key === "bronze")?.benefits[0]
        ?.included,
      false,
    );
    assert.equal(
      body.tiers.find((tier) => tier.key === "gold")?.benefits[0]?.included,
      true,
    );
    assert.equal(body.history.length, 7);
    assert.equal(body.history[6]?.dailyValidViews, 3);
    assert.equal(body.history[6]?.rollingValidViews, 3);
    assert.equal(body.history[6]?.tier?.key, "bronze");

    const vietnamese = await request("/api/member/loyalty?locale=vi", {
      headers: authorization,
    });
    assert.equal(vietnamese.status, 200);
    assert.equal(
      ((await vietnamese.json()) as { summary: { currentTier: { name: string } } })
        .summary.currentTier.name,
      "Đồng",
    );

    assert.equal(
      (
        await request("/api/member/loyalty?locale=not_a_locale", {
          headers: authorization,
        })
      ).status,
      400,
    );
  });
});

describe("Member social links E2E", () => {
  it("generates random aliases independently from title and preserves custom aliases", async () => {
    const email = `link-alias-${process.pid}@example.com`;
    const password = "Secure123";
    const registerResponse = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Link Alias Test",
        email,
        password,
      }),
    });
    assert.equal(registerResponse.status, 201);

    const current = await loginAs(email, password);
    const authorization = {
      Authorization: `Bearer ${current.body.accessToken}`,
    };
    const createPayload = {
      title: "Tiêu đề không được dùng làm slug",
      inputType: "url",
      destinationUrl: "https://example.com/destination",
      actions: [
        {
          platform: "website",
          action: "visit",
          url: "https://example.com/action",
        },
      ],
    };

    const firstResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(createPayload),
    });
    const secondResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(createPayload),
    });

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 201);

    const first = (await firstResponse.json()) as { id: string; slug: string };
    const second = (await secondResponse.json()) as { id: string; slug: string };

    assert.match(first.slug, /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
    assert.match(second.slug, /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
    assert.notEqual(first.slug, second.slug);
    assert.notEqual(first.slug, "tieu-de-khong-duoc-dung-lam-slug");

    const requestedAlias = `custom-alias-${process.pid}`;
    const customResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        ...createPayload,
        customAlias: requestedAlias,
      }),
    });

    assert.equal(customResponse.status, 201);
    const custom = (await customResponse.json()) as {
      id: string;
      slug: string;
    };
    assert.equal(custom.slug, requestedAlias);

    await prisma.link.deleteMany({
      where: {
        id: {
          in: [Number(first.id), Number(second.id), Number(custom.id)],
        },
      },
    });
    await prisma.user.delete({ where: { email } });
  });
});

describe("Member snippets E2E", () => {
  it("isolates owners, soft deletes library rows and preserves link snapshots", async () => {
    const owner = await login();
    const secondEmail = `snippet-owner-${process.pid}@example.com`;
    const registerSecond = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Second Snippet Owner",
        email: secondEmail,
        password: "Secure123",
      }),
    });
    assert.equal(registerSecond.status, 201);
    const second = await loginAs(secondEmail, "Secure123");
    const ownerAuthorization = {
      Authorization: `Bearer ${owner.body.accessToken}`,
    };
    const secondAuthorization = {
      Authorization: `Bearer ${second.body.accessToken}`,
    };

    assert.equal((await request("/api/member/snippets")).status, 401);

    const createSnippetResponse = await request("/api/member/snippets", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        name: "Private launch code",
        content: "ORIGINAL-SNAPSHOT",
      }),
    });
    assert.equal(createSnippetResponse.status, 201);
    const snippet = (await createSnippetResponse.json()) as {
      id: string;
      name: string;
      content: string;
    };

    const listResponse = await request(
      "/api/member/snippets?page=1&limit=10&search=launch&sortBy=name&sortOrder=asc",
      { headers: ownerAuthorization },
    );
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()) as {
      items: Array<Record<string, unknown>>;
      pagination: { totalItems: number; totalPages: number };
    };
    assert.equal(list.pagination.totalItems, 1);
    assert.equal(list.pagination.totalPages, 1);
    assert.equal(list.items[0]?.id, snippet.id);
    assert.equal("copies" in list.items[0], false);

    assert.equal(
      (
        await request(`/api/member/snippets/${snippet.id}`, {
          headers: secondAuthorization,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(`/api/member/snippets/${snippet.id}`, {
          method: "PATCH",
          headers: secondAuthorization,
          body: JSON.stringify({ content: "STOLEN" }),
        })
      ).status,
      404,
    );

    const crossOwnerLink = await request("/api/links", {
      method: "POST",
      headers: secondAuthorization,
      body: JSON.stringify({
        title: "Cross-owner snippet",
        inputType: "snippet",
        selectedSnippet: snippet.id,
        actions: [
          {
            platform: "website",
            action: "visit",
            url: "https://example.com/action",
          },
        ],
      }),
    });
    assert.equal(crossOwnerLink.status, 400);

    const alias = `snippet-snapshot-${process.pid}`;
    const createLinkResponse = await request("/api/links", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        title: "Snapshot link",
        inputType: "snippet",
        selectedSnippet: snippet.id,
        customAlias: alias,
        actions: [
          {
            platform: "website",
            action: "visit",
            url: "https://example.com/action",
          },
        ],
      }),
    });
    assert.equal(createLinkResponse.status, 201);
    assert.equal(
      ((await createLinkResponse.json()) as { destinationUrl: string })
        .destinationUrl,
      "ORIGINAL-SNAPSHOT",
    );

    const updateSnippetResponse = await request(
      `/api/member/snippets/${snippet.id}`,
      {
        method: "PATCH",
        headers: ownerAuthorization,
        body: JSON.stringify({ content: "UPDATED-LIBRARY-CONTENT" }),
      },
    );
    assert.equal(updateSnippetResponse.status, 200);

    const beforeDeleteLink = await request(`/api/links/${alias}`);
    assert.equal(beforeDeleteLink.status, 200);
    assert.equal(
      ((await beforeDeleteLink.json()) as { destinationUrl: string })
        .destinationUrl,
      "ORIGINAL-SNAPSHOT",
    );

    const deleteSnippetResponse = await request(
      `/api/member/snippets/${snippet.id}`,
      { method: "DELETE", headers: ownerAuthorization },
    );
    assert.equal(deleteSnippetResponse.status, 200);
    assert.equal(
      (
        await request(`/api/member/snippets/${snippet.id}`, {
          headers: ownerAuthorization,
        })
      ).status,
      404,
    );

    const deletedRecord = await prisma.snippet.findUniqueOrThrow({
      where: { id: Number(snippet.id) },
    });
    assert.ok(deletedRecord.deletedAt);

    const afterDeleteLink = await request(`/api/links/${alias}`);
    assert.equal(afterDeleteLink.status, 200);
    assert.equal(
      ((await afterDeleteLink.json()) as { destinationUrl: string })
        .destinationUrl,
      "ORIGINAL-SNAPSHOT",
    );

    await prisma.link.delete({ where: { slug: alias } });
    await prisma.snippet.delete({ where: { id: Number(snippet.id) } });
    await prisma.user.delete({ where: { email: secondEmail } });
  });
});

describe("Member files E2E", () => {
  it("isolates owners, reserves quota and blocks deletion while in use", async () => {
    const owner = await login();
    const secondEmail = `file-owner-${process.pid}@example.com`;
    assert.equal((await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Second File Owner", email: secondEmail, password: "Secure123" }),
    })).status, 201);
    const second = await loginAs(secondEmail, "Secure123");
    const ownerAuthorization = { Authorization: `Bearer ${owner.body.accessToken}` };
    const secondAuthorization = { Authorization: `Bearer ${second.body.accessToken}` };

    assert.equal((await request("/api/member/files")).status, 401);

    const initiate = await request("/api/member/files/multipart", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({ fileName: "private.txt", mimeType: "text/plain", size: 4, purpose: "file" }),
    });
    assert.equal(initiate.status, 201);
    const upload = (await initiate.json()) as { uploadId: string; totalParts: number };
    assert.equal(upload.totalParts, 1);
    const ownerId = Number(owner.body.user.id);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })).storageReservedBytes, 4n);

    const form = new FormData();
    form.append("chunk", new Blob(["test"], { type: "text/plain" }), "part-1");
    assert.equal((await request(`/api/member/files/multipart/${upload.uploadId}/parts/1`, {
      method: "POST", headers: ownerAuthorization, body: form,
    })).status, 201);
    const complete = await request(`/api/member/files/multipart/${upload.uploadId}/complete`, {
      method: "POST", headers: ownerAuthorization,
    });
    assert.equal(complete.status, 201);
    const file = (await complete.json()) as { id: string; usageCount: number };
    assert.equal("isPublic" in file, false);
    assert.equal(file.usageCount, 0);
    assert.equal(
      (await request(`/api/member/files/${file.id}/download`, {
        headers: ownerAuthorization,
      })).status,
      404,
    );
    assert.equal(
      (await request(`/api/files/public/${file.id}/download`)).status,
      404,
    );

    const counters = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    assert.equal(counters.storageReservedBytes, 0n);
    assert.equal(counters.storageUsedBytes, 4n);

    const ownerList = await request("/api/member/files?page=1&limit=10&type=document", { headers: ownerAuthorization });
    assert.equal(ownerList.status, 200);
    const ownerFiles = (await ownerList.json()) as {
      items: Array<{ id: string }>;
      pagination: { totalItems: number };
      summary: { usedBytes: number; limitBytes: number };
    };
    assert.equal(ownerFiles.pagination.totalItems, 1);
    assert.equal(ownerFiles.items[0]?.id, file.id);
    assert.equal(ownerFiles.summary.usedBytes, 4);
    assert.equal(ownerFiles.summary.limitBytes, 1024 * 1024);

    const secondList = await request("/api/member/files", { headers: secondAuthorization });
    assert.equal(secondList.status, 200);
    assert.equal(((await secondList.json()) as { pagination: { totalItems: number } }).pagination.totalItems, 0);
    assert.equal((await request(`/api/member/files/${file.id}`, {
      method: "PATCH", headers: secondAuthorization, body: JSON.stringify({ name: "stolen" }),
    })).status, 404);

    const crossOwnerLink = await request("/api/links", {
      method: "POST",
      headers: secondAuthorization,
      body: JSON.stringify({
        title: "Cross-owner file", inputType: "file", selectedFile: file.id,
        actions: [{ platform: "website", action: "visit", url: "https://example.com/action" }],
      }),
    });
    assert.equal(crossOwnerLink.status, 400);

    const alias = `member-file-${process.pid}`;
    const createFileLink = await request("/api/links", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        title: "Owned file", inputType: "file", selectedFile: file.id, customAlias: alias,
        actions: [{ platform: "website", action: "visit", url: "https://example.com/action" }],
      }),
    });
    assert.equal(createFileLink.status, 201);
    const createdFileLink = (await createFileLink.json()) as {
      destinationUrl: string;
      destinationFileName: string | null;
    };
    assert.equal(createdFileLink.destinationUrl, `/api/public/files/${alias}`);
    assert.equal(createdFileLink.destinationFileName, "private.txt");

    const socialLinkDownload = await request(`/api/files/link/${alias}/download`);
    assert.equal(socialLinkDownload.status, 200);
    assert.match(
      socialLinkDownload.headers.get("content-disposition") || "",
      /^attachment;/,
    );
    assert.equal(await socialLinkDownload.text(), "test");

    const inUseDelete = await request(`/api/member/files/${file.id}`, { method: "DELETE", headers: ownerAuthorization });
    assert.equal(inUseDelete.status, 409);
    assert.equal(((await inUseDelete.json()) as { code: string }).code, "FILE_IN_USE");

    const link = await prisma.link.findUniqueOrThrow({ where: { slug: alias } });
    assert.equal((await request(`/api/links/${link.id}`, { method: "DELETE", headers: ownerAuthorization })).status, 200);
    assert.equal((await request(`/api/member/files/${file.id}`, { method: "DELETE", headers: ownerAuthorization })).status, 200);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })).storageUsedBytes, 4n);
  });
});

describe("Admin users CRUD E2E", () => {
  it("enforces admin access and completes create, read, update and delete", async () => {
    const current = await login();

    assert.equal(
      (
        await request("/api/admin/users", {
          headers: { Authorization: `Bearer ${current.body.accessToken}` },
        })
      ).status,
      403,
    );

    const currentUser = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: "admin" },
    });
    await prisma.userHasRole.deleteMany({ where: { userId: currentUser.id } });
    await prisma.userHasRole.create({
      data: { userId: currentUser.id, roleId: adminRole.id },
    });
    const authorization = {
      Authorization: `Bearer ${current.body.accessToken}`,
    };
    adminAccessToken = current.body.accessToken;

    const createdResponse = await request("/api/admin/users", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        name: "Managed User",
        email: "managed@example.com",
        password: "Managed123",
        roles: ["member"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()) as Record<
      string,
      unknown
    > & {
      id: number;
    };
    assert.equal(created.email, "managed@example.com");
    assert.equal(created.balance, "0");
    assert.equal("passwordHash" in created, false);
    assert.equal("refreshTokenHash" in created, false);

    const duplicate = await request("/api/admin/users", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        name: "Duplicate Managed User",
        email: "MANAGED@example.com",
        password: "Managed123",
        roles: ["member"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(duplicate.status, 409);

    const tableQuery = new URLSearchParams({
      page: "1",
      perPage: "10",
      sort: JSON.stringify([{ id: "name", desc: false }]),
      filters: JSON.stringify([
        {
          id: "name",
          value: "managed",
          variant: "text",
          operator: "iLike",
          filterId: "name-filter",
        },
        {
          id: "role",
          value: ["member"],
          variant: "multiSelect",
          operator: "inArray",
          filterId: "role-filter",
        },
        {
          id: "status",
          value: ["active"],
          variant: "multiSelect",
          operator: "inArray",
          filterId: "status-filter",
        },
      ]),
      joinOperator: "and",
    });
    const listResponse = await request(`/api/admin/users?${tableQuery}`, {
      headers: authorization,
    });
    assert.equal(listResponse.status, 200, await listResponse.clone().text());
    const list = (await listResponse.json()) as {
      items: Array<Record<string, unknown>>;
      data: Array<Record<string, unknown>>;
      total: number;
      perPage: number;
      pageCount: number;
      totalPages: number;
      sort: Array<{ id: string; desc: boolean }>;
    };
    assert.equal(list.total, 1);
    assert.equal(list.perPage, 10);
    assert.equal(list.pageCount, 1);
    assert.equal(list.totalPages, 1);
    assert.equal(list.items[0]?.id, created.id);
    assert.equal(list.data[0]?.id, created.id);
    assert.deepEqual(list.sort, [{ id: "name", desc: false }]);
    assert.equal("passwordHash" in list.items[0], false);

    const orFilters = new URLSearchParams({
      filters: JSON.stringify([
        {
          id: "name",
          value: "not-a-user",
          variant: "text",
          operator: "iLike",
          filterId: "or-name-filter",
        },
        {
          id: "email",
          value: "managed@example.com",
          variant: "text",
          operator: "eq",
          filterId: "or-email-filter",
        },
      ]),
      joinOperator: "or",
    });
    const orResponse = await request(`/api/admin/users?${orFilters}`, {
      headers: authorization,
    });
    assert.equal(orResponse.status, 200);
    assert.equal(((await orResponse.json()) as { total: number }).total, 1);

    const invalidFilters = new URLSearchParams({
      filters: JSON.stringify([
        {
          id: "passwordHash",
          value: "secret",
          variant: "text",
          operator: "eq",
          filterId: "invalid-filter",
        },
      ]),
    });
    assert.equal(
      (
        await request(`/api/admin/users?${invalidFilters}`, {
          headers: authorization,
        })
      ).status,
      400,
    );

    const detail = await request(`/api/admin/users/${created.id}`, {
      headers: authorization,
    });
    assert.equal(detail.status, 200);

    const systemFieldUpdate = await request(
      `/api/admin/users/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ createdAt: new Date().toISOString() }),
      },
    );
    assert.equal(systemFieldUpdate.status, 400);

    const verifyEmail = await request(
      `/api/admin/users/${created.id}/verify-email`,
      {
        method: "POST",
        headers: authorization,
      },
    );
    assert.equal(verifyEmail.status, 201, await verifyEmail.clone().text());
    assert.equal(
      ((await verifyEmail.json()) as { emailVerified: boolean }).emailVerified,
      true,
    );
    const verifiedFilter = new URLSearchParams({
      filters: JSON.stringify([
        {
          id: "emailVerifiedAt",
          value: "true",
          variant: "boolean",
          operator: "eq",
          filterId: "verified-filter",
        },
      ]),
    });
    const verifiedList = await request(
      `/api/admin/users?${verifiedFilter}`,
      { headers: authorization },
    );
    assert.equal(verifiedList.status, 200);
    assert.ok(
      ((await verifiedList.json()) as { items: Array<{ id: number }> }).items
        .some((user) => user.id === created.id),
    );

    const deactivate = await request(
      `/api/admin/users/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "inactive" }),
      },
    );
    assert.equal(deactivate.status, 200);
    assert.equal(
      ((await deactivate.json()) as { status: string }).status,
      "inactive",
    );
    const reactivate = await request("/api/admin/users/bulk/status", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({ ids: [created.id], status: "active" }),
    });
    assert.equal(reactivate.status, 200);
    assert.deepEqual(await reactivate.json(), { updated: 1 });

    const updatedResponse = await request(`/api/admin/users/${created.id}`, {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        name: "Managed User Updated",
        roles: ["admin"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(updatedResponse.status, 200);
    const updated = (await updatedResponse.json()) as Record<string, unknown>;
    assert.equal(updated.name, "Managed User Updated");
    assert.equal(updated.role, "admin");

    const revokeSessions = await request(
      `/api/admin/users/${created.id}/revoke-sessions`,
      {
        method: "POST",
        headers: authorization,
      },
    );
    assert.equal(revokeSessions.status, 201);

    const bulkCreatedResponse = await request("/api/admin/users", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        name: "Bulk Managed User",
        email: "bulk-managed@example.com",
        password: "Managed123",
        roles: ["member"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(bulkCreatedResponse.status, 201);
    const bulkCreated = (await bulkCreatedResponse.json()) as { id: number };
    const bulkDelete = await request("/api/admin/users/bulk", {
      method: "DELETE",
      headers: authorization,
      body: JSON.stringify({ ids: [bulkCreated.id] }),
    });
    assert.equal(bulkDelete.status, 200);
    assert.deepEqual(await bulkDelete.json(), { deleted: 1 });

    const selfDemote = await request(`/api/admin/users/${currentUser.id}`, {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({ roles: ["member"] }),
    });
    assert.equal(selfDemote.status, 400);

    const selfDelete = await request(`/api/admin/users/${currentUser.id}`, {
      method: "DELETE",
      headers: authorization,
    });
    assert.equal(selfDelete.status, 400);

    const deletedResponse = await request(`/api/admin/users/${created.id}`, {
      method: "DELETE",
      headers: authorization,
    });
    assert.equal(deletedResponse.status, 200);
    const deleted = (await deletedResponse.json()) as {
      id: number;
      deleted: boolean;
    };
    assert.deepEqual(deleted, { id: created.id, deleted: true });
    assert.equal(
      (
        await request(`/api/admin/users/${created.id}`, {
          headers: authorization,
        })
      ).status,
      404,
    );
    assert.equal((await request("/api/admin/users")).status, 401);
  });
});

describe("Admin social links E2E", () => {
  it("enforces permissions and supports table queries, update, soft delete and restore", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "admin-social-link-test",
        title: "Admin Social Link Test",
        subtitle: "Original subtitle",
        destinationType: "url",
        destinationUrl: "https://example.com/original",
        actions: {
          create: {
            platform: "youtube",
            action: "subscribe",
            url: "https://youtube.com/@example",
          },
        },
      },
    });

    assert.equal((await request("/api/admin/social-links")).status, 401);

    const tableQuery = new URLSearchParams({
      page: "1",
      perPage: "10",
      sort: JSON.stringify([{ id: "title", desc: false }]),
      filters: JSON.stringify([
        {
          id: "title",
          value: "social-link-test",
          variant: "text",
          operator: "iLike",
          filterId: "title-filter",
        },
        {
          id: "destinationType",
          value: ["url"],
          variant: "multiSelect",
          operator: "inArray",
          filterId: "type-filter",
        },
      ]),
      joinOperator: "and",
    });
    const listResponse = await request(
      `/api/admin/social-links?${tableQuery}`,
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200, await listResponse.clone().text());
    const list = (await listResponse.json()) as {
      items: Array<{
        id: number;
        owner: { email: string };
        actionsCount: number;
      }>;
      total: number;
      totalViews: number;
    };
    assert.equal(list.total, 1);
    assert.equal(list.items[0]?.id, link.id);
    assert.equal(list.items[0]?.owner.email, "auth@example.com");
    assert.equal(list.items[0]?.actionsCount, 1);
    assert.equal(list.totalViews, 0);

    const invalidFilters = new URLSearchParams({
      filters: JSON.stringify([
        {
          id: "appearanceJson",
          value: "private",
          variant: "text",
          operator: "iLike",
          filterId: "invalid-filter",
        },
      ]),
    });
    assert.equal(
      (
        await request(`/api/admin/social-links?${invalidFilters}`, {
          headers: authorization,
        })
      ).status,
      400,
    );

    const updatedResponse = await request(
      `/api/admin/social-links/${link.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          title: "Admin Social Link Updated",
          subtitle: "Moderated",
          destinationUrl: "https://example.com/updated",
          status: "paused",
        }),
      },
    );
    assert.equal(updatedResponse.status, 200);
    const updated = (await updatedResponse.json()) as {
      title: string;
      status: string;
      destinationUrl: string;
    };
    assert.equal(updated.title, "Admin Social Link Updated");
    assert.equal(updated.status, "paused");
    assert.equal(updated.destinationUrl, "https://example.com/updated");

    const deletedResponse = await request("/api/admin/social-links/bulk", {
      method: "DELETE",
      headers: authorization,
      body: JSON.stringify({ ids: [link.id] }),
    });
    assert.equal(deletedResponse.status, 200);
    assert.deepEqual(await deletedResponse.json(), { deleted: 1 });

    const deletedQuery = new URLSearchParams({
      deletedState: "deleted",
      filters: JSON.stringify([
        {
          id: "title",
          value: "Admin Social Link Updated",
          variant: "text",
          operator: "iLike",
          filterId: "deleted-title-filter",
        },
      ]),
    });
    const deletedList = await request(
      `/api/admin/social-links?${deletedQuery}`,
      { headers: authorization },
    );
    assert.equal(deletedList.status, 200);
    assert.equal(((await deletedList.json()) as { total: number }).total, 1);

    const restoredResponse = await request(
      "/api/admin/social-links/bulk/restore",
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ ids: [link.id] }),
      },
    );
    assert.equal(restoredResponse.status, 200);
    assert.deepEqual(await restoredResponse.json(), { restored: 1 });
    const restored = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
    });
    assert.equal(restored.deletedAt, null);
    assert.equal(restored.status, "inactive");

    await prisma.link.delete({ where: { id: link.id } });
  });
});

describe("Admin pages CRUD E2E", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Nội dung kiểm thử Pages." }],
      },
    ],
  };

  it("supports validated CRUD, tablecn queries, lifecycle, sanitization and soft delete", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/pages")).status, 401);

    const createResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Chính sách Bảo mật",
        contentJson: document,
        contentHtml:
          '<h1 onclick="alert(1)">An toàn</h1><script>alert(1)</script><a href="javascript:alert(1)">Link</a>',
        excerpt: "Trang kiểm thử.",
        status: "DRAFT",
        robotsIndex: true,
        robotsFollow: true,
        sortOrder: 10,
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      slug: string;
      status: string;
      contentJson: { type: string };
      contentHtml: string;
      publishedAt: string | null;
    };
    assert.equal(created.slug, "chinh-sach-bao-mat");
    assert.equal(created.status, "DRAFT");
    assert.equal(created.contentJson.type, "doc");
    assert.equal(created.publishedAt, null);
    assert.equal(created.contentHtml.includes("<script"), false);
    assert.equal(created.contentHtml.includes("onclick"), false);
    assert.equal(created.contentHtml.includes("javascript:"), false);

    const duplicateResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Trùng slug",
        slug: "CHINH SACH BAO MAT",
        contentJson: document,
        contentHtml: "<p>Duplicate</p>",
      }),
    });
    assert.equal(duplicateResponse.status, 409);

    const secondResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Điều khoản sử dụng",
        slug: "dieu-khoan-su-dung",
        contentJson: document,
        contentHtml: "<p>Điều khoản.</p>",
        status: "DRAFT",
        sortOrder: 20,
      }),
    });
    assert.equal(secondResponse.status, 201);
    const second = (await secondResponse.json()) as { id: number };

    const tableQuery = new URLSearchParams({
      page: "1",
      perPage: "1",
      search: "chinh-sach",
      sort: JSON.stringify([{ id: "title", desc: false }]),
      filters: JSON.stringify([
        {
          id: "status",
          value: ["DRAFT"],
          variant: "multiSelect",
          operator: "inArray",
          filterId: "page-status-filter",
        },
        {
          id: "title",
          value: "Chính sách",
          variant: "text",
          operator: "iLike",
          filterId: "page-title-filter",
        },
      ]),
      joinOperator: "and",
    });
    const listResponse = await request(`/api/admin/pages?${tableQuery}`, {
      headers: authorization,
    });
    assert.equal(listResponse.status, 200, await listResponse.clone().text());
    const list = (await listResponse.json()) as {
      items: Array<{ id: number; contentHtml?: string }>;
      total: number;
      pageCount: number;
      perPage: number;
    };
    assert.equal(list.total, 1);
    assert.equal(list.pageCount, 1);
    assert.equal(list.perPage, 1);
    assert.equal(list.items[0]?.id, created.id);
    assert.equal("contentHtml" in list.items[0]!, false);

    const invalidQuery = new URLSearchParams({
      sort: JSON.stringify([{ id: "contentHtml", desc: true }]),
      filters: JSON.stringify([
        {
          id: "deletedAt",
          value: "x",
          variant: "text",
          operator: "iLike",
          filterId: "private-field",
        },
      ]),
    });
    assert.equal(
      (
        await request(`/api/admin/pages?${invalidQuery}`, {
          headers: authorization,
        })
      ).status,
      400,
    );

    const updateResponse = await request(
      `/api/admin/pages/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          title: "Chính sách quyền riêng tư",
          slug: "quyen-rieng-tu",
          contentJson: document,
          contentHtml: "<p>Nội dung đã cập nhật.</p>",
          seoTitle: "SEO privacy",
          canonicalUrl: "https://example.com/quyen-rieng-tu",
        }),
      },
    );
    assert.equal(updateResponse.status, 200);
    const updated = (await updateResponse.json()) as {
      slug: string;
      seoTitle: string;
    };
    assert.equal(updated.slug, "quyen-rieng-tu");
    assert.equal(updated.seoTitle, "SEO privacy");

    const publishResponse = await request(
      `/api/admin/pages/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "PUBLISHED" }),
      },
    );
    assert.equal(publishResponse.status, 200);
    const published = (await publishResponse.json()) as {
      status: string;
      publishedAt: string;
    };
    assert.equal(published.status, "PUBLISHED");
    assert.ok(published.publishedAt);

    const draftResponse = await request(
      `/api/admin/pages/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "DRAFT" }),
      },
    );
    assert.equal(draftResponse.status, 200);
    const drafted = (await draftResponse.json()) as {
      status: string;
      publishedAt: string;
      contentHtml: string;
    };
    assert.equal(drafted.status, "DRAFT");
    assert.equal(drafted.publishedAt, published.publishedAt);
    assert.equal(drafted.contentHtml, "<p>Nội dung đã cập nhật.</p>");

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: "admin" },
    });
    const publishPermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "pages.publish" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: publishPermission.id,
        },
      },
    });
    const deniedPublish = await request(
      `/api/admin/pages/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "PUBLISHED" }),
      },
    );
    assert.equal(deniedPublish.status, 403);
    await prisma.roleHasPermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: publishPermission.id,
      },
    });

    const bulkArchive = await request("/api/admin/pages/bulk/status", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        ids: [created.id, second.id, second.id],
        status: "ARCHIVED",
      }),
    });
    assert.equal(bulkArchive.status, 200);
    assert.deepEqual(await bulkArchive.json(), { updated: 2 });

    const restored = await request("/api/admin/pages/bulk/status", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        ids: [created.id, second.id],
        status: "DRAFT",
      }),
    });
    assert.equal(restored.status, 200);
    assert.deepEqual(await restored.json(), { updated: 2 });

    const deletePermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "pages.delete" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: deletePermission.id,
        },
      },
    });
    const deniedDelete = await request("/api/admin/pages/bulk", {
      method: "DELETE",
      headers: authorization,
      body: JSON.stringify({ ids: [created.id] }),
    });
    assert.equal(deniedDelete.status, 403);
    await prisma.roleHasPermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: deletePermission.id,
      },
    });

    const deleteResponse = await request("/api/admin/pages/bulk", {
      method: "DELETE",
      headers: authorization,
      body: JSON.stringify({ ids: [created.id, second.id] }),
    });
    assert.equal(deleteResponse.status, 200);
    assert.deepEqual(await deleteResponse.json(), { deleted: 2 });
    assert.equal(
      (
        await request(`/api/admin/pages/${created.id}`, {
          headers: authorization,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request("/api/admin/pages?search=quyen-rieng-tu", {
          headers: authorization,
        })
      ).status,
      200,
    );
    const deletedList = await request(
      "/api/admin/pages?search=quyen-rieng-tu",
      { headers: authorization },
    );
    assert.equal(
      ((await deletedList.json()) as { total: number }).total,
      0,
    );
    assert.equal(
      (
        await request("/api/admin/pages/987654321", {
          headers: authorization,
        })
      ).status,
      404,
    );

    await prisma.page.deleteMany({
      where: { id: { in: [created.id, second.id] } },
    });
  });
});

describe("Admin monetization levels E2E", () => {
  const payload = (key: string, isDefault = false) => ({
    key,
    status: "published",
    isDefault,
    sortOrder: 10,
    translations: [
      {
        locale: "vi",
        name: `Cấp độ ${key}`,
        description: "Mô tả kiểm thử.",
      },
      {
        locale: "en",
        name: `Level ${key}`,
        description: "Test description.",
      },
    ],
    metaData: {
      version: 1,
      profitBps: 100,
      stepCount: 1,
      visitorExperience: {
        popup: "limited",
        banner: "none",
        interstitial: "none",
        notification: "none",
      },
    },
    routes: [],
    rates: [],
  });

  it("supports validated CRUD, translations and a single default level", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/monetization-levels")).status, 401);

    const firstResponse = await request("/api/admin/monetization-levels", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload("test-clean", true)),
    });
    assert.equal(firstResponse.status, 201, await firstResponse.clone().text());
    const first = (await firstResponse.json()) as {
      id: number;
      isDefault: boolean;
      translations: Array<{ locale: string }>;
    };
    assert.equal(first.isDefault, true);
    assert.deepEqual(
      first.translations.map(({ locale }) => locale),
      ["en", "vi"],
    );

    const duplicateResponse = await request("/api/admin/monetization-levels", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload("test-clean")),
    });
    assert.equal(duplicateResponse.status, 409);

    const secondResponse = await request("/api/admin/monetization-levels", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        ...payload("test-balanced", true),
        sortOrder: 20,
      }),
    });
    assert.equal(secondResponse.status, 201);
    const second = (await secondResponse.json()) as {
      id: number;
      isDefault: boolean;
    };
    assert.equal(second.isDefault, true);
    assert.equal(
      (
        await prisma.monetizationLevel.findUniqueOrThrow({
          where: { id: first.id },
        })
      ).isDefault,
      false,
    );

    const updatedResponse = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-vn-mobile",
              countryCode: "VN",
              countryMode: "exclude",
              deviceType: "mobile",
              deviceMode: "exclude",
              browserFamily: "safari",
              browserMode: "exclude",
              targetUrl: "https://example.com/vn",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
          rates: [
            {
              countryCode: "VN",
              deviceType: "mobile",
              baseCpm: "1.2500",
              currency: "USD",
              dailyLimit: 1000,
              enabled: true,
            },
          ],
          metaData: {
            version: 1,
            profitBps: 250,
            stepCount: 2,
            visitorExperience: {
              popup: "limited",
              banner: "limited",
              interstitial: "none",
              notification: "none",
            },
          },
        }),
      },
    );
    assert.equal(
      updatedResponse.status,
      200,
      await updatedResponse.clone().text(),
    );
    const updated = (await updatedResponse.json()) as {
      routes: Array<{
        countryMode: string;
        deviceMode: string;
        browserMode: string;
      }>;
      rates: unknown[];
      metaData: { profitBps: number };
    };
    assert.equal(updated.routes.length, 1);
    assert.equal(updated.routes[0]?.countryMode, "exclude");
    assert.equal(updated.routes[0]?.deviceMode, "exclude");
    assert.equal(updated.routes[0]?.browserMode, "exclude");
    assert.equal(updated.rates.length, 1);
    assert.equal(updated.metaData.profitBps, 250);

    const invalidExcludedCountries = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-invalid-exclusion",
              countryCode: "ALL",
              countryMode: "exclude",
              deviceType: "any",
              browserFamily: "any",
              targetUrl: "https://example.com/invalid",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidExcludedCountries.status, 400);

    const invalidExcludedDevices = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-invalid-device-exclusion",
              countryCode: "VN",
              countryMode: "include",
              deviceType: "any",
              deviceMode: "exclude",
              browserFamily: "any",
              browserMode: "include",
              targetUrl: "https://example.com/invalid",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidExcludedDevices.status, 400);

    const invalidExcludedBrowsers = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-invalid-browser-exclusion",
              countryCode: "VN",
              countryMode: "include",
              deviceType: "any",
              deviceMode: "include",
              browserFamily: "any",
              browserMode: "exclude",
              targetUrl: "https://example.com/invalid",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidExcludedBrowsers.status, 400);

    const listResponse = await request(
      "/api/admin/monetization-levels?name=test&page=1&perPage=10",
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200);
    const listResult = (await listResponse.json()) as {
      total: number;
      summary: {
        publishedLevels: number;
        configuredRoutes: number;
        configuredRates: number;
        assignedUsers: number;
      };
    };
    assert.equal(listResult.total, 2);
    assert.equal(listResult.summary.publishedLevels, 2);
    assert.equal(listResult.summary.configuredRoutes, 1);
    assert.equal(listResult.summary.configuredRates, 1);
    assert.equal(listResult.summary.assignedUsers, 0);

    const invalidRates = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          rates: [
            {
              countryCode: "VN",
              deviceType: "any",
              baseCpm: "1.00",
              currency: "USD",
              enabled: true,
            },
            {
              countryCode: "VN",
              deviceType: "any",
              baseCpm: "2.00",
              currency: "USD",
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidRates.status, 400);

    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    const linked = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "monetized-link-test",
        title: "Monetized link test",
      },
    });
    const memberSession = await login();
    const memberLevelsResponse = await request(
      "/api/member/monetization-levels",
      {
        headers: {
          Authorization: `Bearer ${memberSession.body.accessToken}`,
        },
      },
    );
    assert.equal(
      memberLevelsResponse.status,
      200,
      await memberLevelsResponse.clone().text(),
    );
    const memberLevels = (await memberLevelsResponse.json()) as {
      items: Array<{
        id: number;
        rates: unknown[];
        routes?: unknown[];
      }>;
      total: number;
      selectedLevelId: number | null;
      effectiveLevelId: number | null;
      usesSystemDefault: boolean;
      totalLinks: number;
    };
    assert.equal(memberLevels.total, 2);
    assert.equal(memberLevels.selectedLevelId, null);
    assert.equal(memberLevels.effectiveLevelId, second.id);
    assert.equal(memberLevels.usesSystemDefault, true);
    assert.equal(memberLevels.totalLinks, 1);
    assert.equal(
      memberLevels.items.find((level) => level.id === first.id)?.rates.length,
      1,
    );
    assert.equal(
      "routes" in
        (memberLevels.items.find((level) => level.id === first.id) ?? {}),
      false,
    );
    const selectFirstResponse = await request(
      "/api/member/monetization-levels/selection",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${memberSession.body.accessToken}`,
        },
        body: JSON.stringify({ monetizationLevelId: first.id }),
      },
    );
    assert.equal(
      selectFirstResponse.status,
      200,
      await selectFirstResponse.clone().text(),
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({
          where: { id: owner.id },
        })
      ).monetizationLevelId,
      first.id,
    );
    assert.equal(
      (
        await request(`/api/admin/monetization-levels/${first.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      409,
    );
    const selectSecondResponse = await request(
      "/api/member/monetization-levels/selection",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${memberSession.body.accessToken}`,
        },
        body: JSON.stringify({ monetizationLevelId: second.id }),
      },
    );
    assert.equal(selectSecondResponse.status, 200);
    await prisma.link.delete({ where: { id: linked.id } });
    assert.equal(
      (
        await request(`/api/admin/monetization-levels/${first.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/monetization-levels/${second.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      400,
    );
  });
});

describe("Admin Loyalty tiers E2E", () => {
  const benefits = (locale: "vi" | "en") => [
    {
      key: "csv_export",
      label: locale === "vi" ? "Xuất CSV" : "CSV export",
      included: true,
      value: null,
    },
    {
      key: "custom_qr",
      label: locale === "vi" ? "QR tùy chỉnh" : "Custom QR",
      included: false,
      value: null,
    },
  ];
  const payload = {
    key: "admin-loyalty-test",
    minimumValidViews: 123_456,
    sortOrder: 90,
    iconKey: "trophy",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "Hạng kiểm thử",
        description: "Mô tả quản trị Loyalty.",
        benefits: benefits("vi"),
      },
      {
        locale: "en",
        name: "Test tier",
        description: "Loyalty administration description.",
        benefits: benefits("en"),
      },
    ],
  };

  it("supports protected CRUD and preserves check/X states across locales", async () => {
    assert.ok(adminAccessToken);
    const authorization = { Authorization: `Bearer ${adminAccessToken}` };
    assert.equal((await request("/api/admin/loyalty-tiers")).status, 401);

    const createResponse = await request("/api/admin/loyalty-tiers", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      displayName: string;
      benefitsCount: number;
      includedBenefitsCount: number;
      translations: Array<{
        locale: string;
        benefits: Array<{ key: string; included: boolean }>;
      }>;
    };
    assert.equal(created.displayName, "Hạng kiểm thử");
    assert.equal(created.benefitsCount, 2);
    assert.equal(created.includedBenefitsCount, 1);
    assert.equal(
      created.translations.find(({ locale }) => locale === "en")?.benefits[1]
        ?.included,
      false,
    );

    const duplicateThreshold = await request("/api/admin/loyalty-tiers", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ ...payload, key: "admin-loyalty-duplicate" }),
    });
    assert.equal(duplicateThreshold.status, 409);

    const inconsistentBenefits = await request(
      `/api/admin/loyalty-tiers/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          translations: [
            payload.translations[0],
            {
              ...payload.translations[1],
              benefits: benefits("en").map((benefit, index) =>
                index === 1 ? { ...benefit, included: true } : benefit,
              ),
            },
          ],
        }),
      },
    );
    assert.equal(inconsistentBenefits.status, 400);

    const updateResponse = await request(
      `/api/admin/loyalty-tiers/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          sortOrder: 95,
          status: "draft",
          translations: payload.translations.map((translation) => ({
            ...translation,
            benefits: translation.benefits.map((benefit) => ({
              ...benefit,
              included: false,
            })),
          })),
        }),
      },
    );
    assert.equal(updateResponse.status, 200, await updateResponse.clone().text());
    const updated = (await updateResponse.json()) as {
      status: string;
      sortOrder: number;
      includedBenefitsCount: number;
    };
    assert.equal(updated.status, "draft");
    assert.equal(updated.sortOrder, 95);
    assert.equal(updated.includedBenefitsCount, 0);

    const listResponse = await request(
      "/api/admin/loyalty-tiers?name=admin-loyalty&page=1&perPage=10",
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()) as {
      total: number;
      summary: { configuredBenefits: number; highestThreshold: number };
    };
    assert.equal(list.total, 1);
    assert.equal(list.summary.configuredBenefits, 2);
    assert.equal(list.summary.highestThreshold, 123_456);

    assert.equal(
      (
        await request(`/api/admin/loyalty-tiers/${created.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/loyalty-tiers/${created.id}`, {
          headers: authorization,
        })
      ).status,
      404,
    );
  });
});

describe("Public monetization route resolution E2E", () => {
  it("uses deterministic weighted selection within the highest priority", () => {
    const routes: MonetizationRouteDto[] = [
      {
        id: "light",
        countryCode: "ALL",
        countryMode: "include",
        deviceType: "any",
        deviceMode: "include",
        browserFamily: "any",
        browserMode: "include",
        targetUrl: "https://example.com/light",
        priority: 20,
        weight: 10,
        enabled: true,
      },
      {
        id: "heavy",
        countryCode: "ALL",
        countryMode: "include",
        deviceType: "any",
        deviceMode: "include",
        browserFamily: "any",
        browserMode: "include",
        targetUrl: "https://example.com/heavy",
        priority: 20,
        weight: 90,
        enabled: true,
      },
    ];
    const counts = { light: 0, heavy: 0 };

    for (let index = 0; index < 500; index += 1) {
      const resolved = resolveMonetizationRoute(routes, {
        countryCode: "VN",
        deviceType: "mobile",
        browserFamily: "chrome",
        visitorKey: `visitor-${index}`,
      });
      assert.ok(resolved);
      counts[resolved.id as keyof typeof counts] += 1;
    }

    assert.ok(counts.heavy > counts.light * 4);
    assert.equal(
      resolveMonetizationRoute(routes, {
        countryCode: "VN",
        deviceType: "mobile",
        browserFamily: "chrome",
        visitorKey: "same-visitor",
      })?.id,
      resolveMonetizationRoute(routes, {
        countryCode: "VN",
        deviceType: "mobile",
        browserFamily: "chrome",
        visitorKey: "same-visitor",
      })?.id,
    );
  });

  it("resolves country, device and browser rules with priority and fallback", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "public-route-resolution",
        status: "published",
        routesJson: JSON.stringify([
          {
            id: "fallback",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/fallback",
            priority: 0,
            weight: 100,
            enabled: true,
          },
          {
            id: "not-safari",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "safari",
            browserMode: "exclude",
            targetUrl: "https://example.com/not-safari",
            priority: 10,
            weight: 100,
            enabled: true,
          },
          {
            id: "outside-vn-non-mobile",
            countryCode: "VN",
            countryMode: "exclude",
            deviceType: "mobile",
            deviceMode: "exclude",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/outside-vn-non-mobile",
            priority: 15,
            weight: 100,
            enabled: true,
          },
          {
            id: "vn-mobile-chrome",
            countryCode: "VN",
            countryMode: "include",
            deviceType: "mobile",
            deviceMode: "include",
            browserFamily: "chrome",
            browserMode: "include",
            targetUrl: "https://example.com/vn-mobile-chrome",
            priority: 20,
            weight: 100,
            enabled: true,
          },
        ]),
      },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Public Route Owner",
        email: "public-route-owner@example.com",
        monetizationLevelId: level.id,
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "public-route-resolution",
        title: "Public route resolution",
        destinationType: "url",
        destinationUrl: "https://example.com/original",
      },
    });

    const vnMobileChrome = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "VN",
          "X-Visitor-IP": "203.0.113.10",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
        },
      },
    );
    assert.equal(vnMobileChrome.status, 200);
    const vnMobileChromeBody = (await vnMobileChrome.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
      visitToken: string;
    };
    assert.equal(
      vnMobileChromeBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      vnMobileChromeBody.monetizationRedirectUrl,
      "https://example.com/vn-mobile-chrome",
    );

    const usDesktopFirefox = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "US",
          "X-Visitor-IP": "203.0.113.11",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        },
      },
    );
    assert.equal(usDesktopFirefox.status, 200);
    const usDesktopFirefoxBody = (await usDesktopFirefox.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(
      usDesktopFirefoxBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      usDesktopFirefoxBody.monetizationRedirectUrl,
      "https://example.com/outside-vn-non-mobile",
    );

    const vnDesktopFirefox = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "VN",
          "X-Visitor-IP": "203.0.113.12",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        },
      },
    );
    assert.equal(vnDesktopFirefox.status, 200);
    const vnDesktopFirefoxBody = (await vnDesktopFirefox.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(
      vnDesktopFirefoxBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      vnDesktopFirefoxBody.monetizationRedirectUrl,
      "https://example.com/not-safari",
    );

    const vnDesktopSafari = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "VN",
          "X-Visitor-IP": "203.0.113.13",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
        },
      },
    );
    assert.equal(vnDesktopSafari.status, 200);
    const vnDesktopSafariBody = (await vnDesktopSafari.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(
      vnDesktopSafariBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      vnDesktopSafariBody.monetizationRedirectUrl,
      "https://example.com/fallback",
    );

    assert.equal(
      await prisma.linkAccessLog.count({ where: { linkId: link.id } }),
      4,
    );
    assert.equal(
      await prisma.linkAccessLog.count({
        where: { linkId: link.id, completedAt: { not: null } },
      }),
      0,
    );

    const successfulVisit = await request(
      `/api/links/${link.slug}/visit/${vnMobileChromeBody.visitToken}/complete`,
      { method: "POST" },
    );
    assert.equal(successfulVisit.status, 200);
    const accessLog = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: vnMobileChromeBody.visitToken },
      include: { userAgent: true },
    });
    assert.ok(accessLog.completedAt);
    assert.equal(accessLog.country, "VN");
    assert.equal(accessLog.device, 1);
    assert.equal(accessLog.userAgent.browser, "chrome");
    assert.equal(accessLog.ipAddress, "203.0.113.10");

    const dashboard = await request("/api/admin/dashboard?range=7d", {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(dashboard.status, 200);
    const dashboardBody = (await dashboard.json()) as {
      metrics: { unlocks: number; uniqueIps: number };
      recentUnlocks: Array<{ id: string; countryCode: string }>;
    };
    assert.ok(dashboardBody.metrics.unlocks >= 1);
    assert.ok(dashboardBody.metrics.uniqueIps >= 1);
    assert.equal(dashboardBody.recentUnlocks[0]?.id, accessLog.id);
    assert.equal(dashboardBody.recentUnlocks[0]?.countryCode, "VN");

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });

  it("keeps file destinations separate from the monetization redirect", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "public-file-route-resolution",
        status: "published",
        routesJson: JSON.stringify([
          {
            id: "all",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/route",
            priority: 10,
            weight: 100,
            enabled: true,
          },
        ]),
      },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Public File Route Owner",
        email: "public-file-route-owner@example.com",
        monetizationLevelId: level.id,
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "public-file-route-resolution",
        title: "Public file route resolution",
        destinationType: "file",
        destinationUrl: "https://example.com/original-file",
      },
    });

    const response = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: {
        "X-Visitor-Country": "VN",
        "User-Agent": "Mozilla/5.0 Chrome/124.0.0.0",
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(body.destinationUrl, "https://example.com/original-file");
    assert.equal(
      body.monetizationRedirectUrl,
      "https://example.com/route",
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });

  it("tracks a non-monetized destination completion in access logs", async () => {
    const owner = await prisma.user.create({
      data: {
        name: "Standard Visit Owner",
        email: "standard-visit-owner@example.com",
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "standard-visit-completion",
        title: "Standard visit completion",
        destinationUrl: "https://example.com/destination",
      },
    });

    const visit = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: {
        "X-Visitor-Country": "US",
        "X-Visitor-IP": "203.0.113.70",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
    });
    assert.equal(visit.status, 200);
    const body = (await visit.json()) as {
      monetizationRedirectUrl: string | null;
      visitToken: string;
    };
    assert.equal(body.monetizationRedirectUrl, null);
    assert.ok(body.visitToken);

    const pending = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: body.visitToken },
    });
    assert.equal(pending.levelId, null);
    assert.equal(pending.payoutCpm.toString(), "0");
    assert.equal(pending.completedAt, null);

    const completion = await request(
      `/api/links/${link.slug}/visit/${body.visitToken}/complete`,
      { method: "POST" },
    );
    assert.equal(completion.status, 200);
    assert.ok(
      (
        await prisma.linkAccessLog.findUniqueOrThrow({
          where: { id: body.visitToken },
        })
      ).completedAt,
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
  });

  it("completes and aggregates monetized visits exactly once per minute", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "visit-aggregation",
        status: "published",
        routesJson: JSON.stringify([
          {
            id: "visit-route",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/visit-route",
            priority: 10,
            weight: 100,
            enabled: true,
          },
        ]),
        ratesJson: JSON.stringify([
          {
            countryCode: "VN",
            deviceType: "mobile",
            baseCpm: "10",
            currency: "USD",
            dailyLimit: 1,
            enabled: true,
          },
        ]),
        metaDataJson: JSON.stringify({
          version: 1,
          profitBps: 5_000,
          stepCount: 1,
          visitorExperience: {
            popup: "none",
            banner: "none",
            interstitial: "none",
            notification: "none",
          },
        }),
      },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Visit Aggregation Owner",
        email: "visit-aggregation-owner@example.com",
        monetizationLevelId: level.id,
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "visit-aggregation",
        title: "Visit aggregation",
        destinationUrl: "https://example.com/destination",
      },
    });
    const visitHeaders = {
      "X-Visitor-Country": "VN",
      "X-Visitor-IP": "203.0.113.80",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
      Referer: "https://publisher.example/article",
    };

    const firstVisit = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: visitHeaders,
    });
    assert.equal(firstVisit.status, 200);
    const firstBody = (await firstVisit.json()) as {
      visitToken: string;
      monetizationRedirectUrl: string;
    };
    assert.ok(firstBody.visitToken);
    assert.equal(
      firstBody.monetizationRedirectUrl,
      "https://example.com/visit-route",
    );

    const pending = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: firstBody.visitToken },
    });
    assert.equal(pending.completedAt, null);
    assert.equal(pending.processedAt, null);
    assert.equal(pending.country, "VN");
    assert.equal(pending.device, 1);
    assert.equal(pending.referrer, "https://publisher.example/article");
    assert.equal(pending.payoutCpm.toString(), "5");
    assert.equal(
      await prisma.userAgent.count({ where: { hash: pending.agentHash } }),
      1,
    );

    const completePath =
      `/api/links/${link.slug}/visit/${firstBody.visitToken}/complete`;
    assert.equal(
      (await request(completePath, { method: "POST" })).status,
      200,
    );
    assert.equal(
      (await request(completePath, { method: "POST" })).status,
      200,
    );
    assert.ok(
      (
        await prisma.linkAccessLog.findUniqueOrThrow({
          where: { id: firstBody.visitToken },
        })
      ).completedAt,
    );

    const worker = app.get(LinkAccessAggregationWorker);
    const firstRunAt = new Date(Date.now() + 1_000);
    const firstRun = await worker.processPending(firstRunAt);
    assert.equal(firstRun.processedCount, 1);
    assert.equal(firstRun.earnedViews, 1);
    assert.equal(firstRun.revenue, "0.005");
    const duplicateMinute = await worker.processPending(firstRunAt);
    assert.equal(duplicateMinute.skipped, true);
    assert.equal(duplicateMinute.processedCount, 0);

    const aggregatedLink = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
    });
    const aggregatedOwner = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
    });
    assert.equal(aggregatedLink.views, 1);
    assert.equal(aggregatedLink.revenue.toString(), "0.005");
    assert.equal(aggregatedOwner.balance.toString(), "0.005");
    const secondVisit = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: visitHeaders,
    });
    const secondBody = (await secondVisit.json()) as { visitToken: string };
    assert.equal(
      (
        await request(
          `/api/links/${link.slug}/visit/${secondBody.visitToken}/complete`,
          { method: "POST" },
        )
      ).status,
      200,
    );

    const secondRun = await worker.processPending(
      new Date(firstRunAt.getTime() + 60_000),
    );
    assert.equal(secondRun.processedCount, 1);
    assert.equal(secondRun.earnedViews, 0);
    const rejected = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: secondBody.visitToken },
    });
    assert.equal(rejected.isEarn, false);
    assert.equal(rejected.rejectReasonMask & 1, 1);

    const unchangedLink = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
    });
    const unchangedOwner = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
    });
    assert.equal(unchangedLink.views, 2);
    assert.equal(unchangedLink.revenue.toString(), "0.005");
    assert.equal(unchangedOwner.balance.toString(), "0.005");

    const noDuplicateRun = await worker.processPending(
      new Date(firstRunAt.getTime() + 120_000),
    );
    assert.equal(noDuplicateRun.processedCount, 0);
    assert.equal(
      (await prisma.link.findUniqueOrThrow({ where: { id: link.id } })).views,
      2,
    );

    await prisma.linkAccessLog.createMany({
      data: Array.from({ length: 1_200 }, (_, index) => ({
        id: `batch-${process.pid}-${index}`,
        linkId: link.id,
        userId: owner.id,
        levelId: level.id,
        agentHash: pending.agentHash,
        ipAddress: `10.20.${Math.floor(index / 250)}.${index % 250}`,
        country: "VN",
        device: 1,
        referrer: "direct",
        payoutCpm: "0",
        completedAt: new Date(firstRunAt.getTime() + 150_000),
      })),
    });

    const fullBatch = await worker.processPending(
      new Date(firstRunAt.getTime() + 180_000),
    );
    assert.equal(fullBatch.processedCount, 1_000);
    assert.equal(fullBatch.batchSize, 1_000);

    const finalBatch = await worker.processPending(
      new Date(firstRunAt.getTime() + 240_000),
    );
    assert.equal(finalBatch.processedCount, 200);
    assert.equal(
      (await prisma.link.findUniqueOrThrow({ where: { id: link.id } })).views,
      1_202,
    );
    assert.equal(
      await prisma.linkAccessLog.count({
        where: { linkId: link.id, processedAt: null },
      }),
      0,
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });
});

describe("Admin Media E2E", () => {
  it("isolates folders and files, supports bulk move, and blocks media in use", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };

    assert.equal((await request("/api/admin/media")).status, 401);

    const rootFolderResponse = await request("/api/admin/media/folders", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ name: "Brand assets", parentId: null }),
    });
    assert.equal(
      rootFolderResponse.status,
      201,
      await rootFolderResponse.clone().text(),
    );
    const rootFolder = (await rootFolderResponse.json()) as { id: string };

    const childFolderResponse = await request("/api/admin/media/folders", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ name: "Logos", parentId: rootFolder.id }),
    });
    assert.equal(childFolderResponse.status, 201);
    const childFolder = (await childFolderResponse.json()) as { id: string };

    const duplicateFolderResponse = await request(
      "/api/admin/media/folders",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({ name: " logos ", parentId: rootFolder.id }),
      },
    );
    assert.equal(duplicateFolderResponse.status, 409);
    assert.equal(
      ((await duplicateFolderResponse.json()) as { code: string }).code,
      "FOLDER_NAME_EXISTS",
    );

    const onePixelPng = Uint8Array.from(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    );
    const form = new FormData();
    form.append(
      "files",
      new Blob([onePixelPng], { type: "image/png" }),
      "logo-light.png",
    );
    form.append(
      "files",
      new Blob([onePixelPng], { type: "image/png" }),
      "logo-dark.png",
    );
    const uploadResponse = await request(
      `/api/admin/media/upload?folderId=${childFolder.id}`,
      {
        method: "POST",
        headers: authorization,
        body: form,
      },
    );
    assert.equal(uploadResponse.status, 201, await uploadResponse.clone().text());
    const uploaded = (await uploadResponse.json()) as {
      items: Array<{
        id: string;
        folderId: string;
        mimeType: string;
        width: number;
        height: number;
        url: string;
      }>;
    };
    assert.equal(uploaded.items.length, 2);
    assert.equal(uploaded.items[0]?.folderId, childFolder.id);
    assert.equal(uploaded.items[0]?.mimeType, "image/png");
    assert.equal(uploaded.items[0]?.width, 1);
    assert.equal(uploaded.items[0]?.height, 1);
    const mediaIds = uploaded.items.map((item) => item.id);

    const listResponse = await request(
      `/api/admin/media?folderId=${childFolder.id}&type=image%2Fpng&sortBy=fileName&sortOrder=asc`,
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200);
    assert.equal(
      ((await listResponse.json()) as { total: number }).total,
      2,
    );

    const contentResponse = await request(
      `/api/admin-media/public/${mediaIds[0]}/content`,
    );
    assert.equal(contentResponse.status, 200);
    assert.equal(contentResponse.headers.get("content-type"), "image/png");

    const updateResponse = await request(
      `/api/admin/media/${mediaIds[0]}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          fileName: "Primary logo.png",
          altText: "Primary brand logo",
          caption: "Used in the test page",
        }),
      },
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(
      ((await updateResponse.json()) as { altText: string }).altText,
      "Primary brand logo",
    );

    const blockedFolderDelete = await request(
      `/api/admin/media/folders/${rootFolder.id}`,
      { method: "DELETE", headers: authorization },
    );
    assert.equal(blockedFolderDelete.status, 409);
    assert.equal(
      ((await blockedFolderDelete.json()) as { code: string }).code,
      "FOLDER_NOT_EMPTY",
    );

    const bulkMoveResponse = await request("/api/admin/media/bulk-move", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ ids: mediaIds, folderId: null }),
    });
    assert.equal(bulkMoveResponse.status, 201);
    assert.equal(
      ((await bulkMoveResponse.json()) as { moved: number }).moved,
      2,
    );

    const pageResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Admin Media usage guard",
        slug: `admin-media-usage-${process.pid}`,
        contentJson: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
        contentHtml: "<p>Admin Media usage test.</p>",
        featuredImageId: mediaIds[0],
        status: "DRAFT",
        robotsIndex: true,
        robotsFollow: true,
        sortOrder: 0,
      }),
    });
    assert.equal(pageResponse.status, 201, await pageResponse.clone().text());
    const page = (await pageResponse.json()) as { id: number };

    const blockedMediaDelete = await request(
      `/api/admin/media/${mediaIds[0]}`,
      { method: "DELETE", headers: authorization },
    );
    assert.equal(blockedMediaDelete.status, 409);
    assert.equal(
      ((await blockedMediaDelete.json()) as { code: string }).code,
      "MEDIA_IN_USE",
    );

    assert.equal(
      (
        await request(`/api/admin/pages/${page.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );

    const bulkDeleteResponse = await request(
      "/api/admin/media/bulk-delete",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({ ids: mediaIds }),
      },
    );
    assert.equal(
      bulkDeleteResponse.status,
      201,
      await bulkDeleteResponse.clone().text(),
    );
    assert.equal(
      ((await bulkDeleteResponse.json()) as { deleted: number }).deleted,
      2,
    );

    assert.equal(
      (
        await request(`/api/admin/media/folders/${childFolder.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/media/folders/${rootFolder.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
  });
});

describe("Website settings E2E", () => {
  it("protects admin settings, validates input and exposes only public fields", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };

    assert.equal(
      (await request("/api/admin/settings/appearance")).status,
      401,
    );

    const updateResponse = await request("/api/admin/settings/appearance", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        siteName: "STU Test",
        siteShortName: "STU",
        siteDescription: "Website settings integration test.",
        siteTagline: "Settings without restart.",
        siteUrl: "https://example.com",
        logoLightId: null,
        logoDarkId: null,
        logoIconId: null,
        faviconId: null,
        defaultOgImageId: null,
        socialLinks: [
          {
            platform: "github",
            url: "https://github.com/example",
            isActive: true,
            sortOrder: 0,
          },
          {
            platform: "facebook",
            url: "https://facebook.com/example",
            isActive: false,
            sortOrder: 1,
          },
        ],
        contactEmail: "contact@example.com",
        supportEmail: null,
        phone: null,
        address: null,
        workingHours: null,
        mapUrl: null,
      }),
    });
    assert.equal(
      updateResponse.status,
      200,
      await updateResponse.clone().text(),
    );
    const adminBody = (await updateResponse.json()) as {
      siteName: string;
      socialLinks: Array<{ platform: string }>;
    };
    assert.equal(adminBody.siteName, "STU Test");
    assert.equal(adminBody.socialLinks.length, 2);

    const publicResponse = await request("/api/site-config");
    assert.equal(publicResponse.status, 200);
    const publicBody = (await publicResponse.json()) as {
      siteName: string;
      socialLinks: Array<{ platform: string }>;
      updatedById?: number;
    };
    assert.equal(publicBody.siteName, "STU Test");
    assert.deepEqual(
      publicBody.socialLinks.map((link) => link.platform),
      ["github"],
    );
    assert.equal("updatedById" in publicBody, false);

    const invalidResponse = await request("/api/admin/settings/appearance", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        ...adminBody,
        siteUrl: "not-a-url",
        socialLinks: [],
        contactEmail: null,
        supportEmail: null,
        phone: null,
        address: null,
        workingHours: null,
        mapUrl: null,
      }),
    });
    assert.equal(invalidResponse.status, 400);
  });
});

describe("Roles and permissions E2E", () => {
  it("supports role permissions, direct permissions and live permission changes", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };

    const permissionsResponse = await request("/api/admin/permissions", {
      headers: adminAuthorization,
    });
    assert.equal(permissionsResponse.status, 200);
    const permissions = (await permissionsResponse.json()) as Array<{
      key: string;
    }>;
    assert.ok(
      permissions.some((permission) => permission.key === "users.read"),
    );

    const createRoleResponse = await request("/api/admin/roles", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        key: "content-manager",
        name: "Content Manager",
        description: "Role kiểm thử.",
        permissionKeys: ["admin.access", "users.read"],
      }),
    });
    assert.equal(createRoleResponse.status, 201);
    const role = (await createRoleResponse.json()) as {
      id: number;
      key: string;
    };
    assert.equal(role.key, "content-manager");

    const createManagerResponse = await request("/api/admin/users", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        name: "Permission Manager",
        email: "permission-manager@example.com",
        password: "Manager123",
        roles: ["content-manager"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(
      createManagerResponse.status,
      201,
      await createManagerResponse.clone().text(),
    );
    const managerUser = (await createManagerResponse.json()) as { id: number };
    const manager = await loginAs(
      "permission-manager@example.com",
      "Manager123",
      "127.0.0.2",
    );
    const managerAuthorization = {
      Authorization: `Bearer ${manager.body.accessToken}`,
    };

    assert.equal(
      (
        await request("/api/admin/users", {
          headers: managerAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/api/admin/roles", {
          headers: managerAuthorization,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/api/admin/users", {
          method: "POST",
          headers: managerAuthorization,
          body: JSON.stringify({
            name: "Denied User",
            email: "denied@example.com",
            password: "Denied123",
            roles: ["member"],
            permissions: [],
            status: "active",
          }),
        })
      ).status,
      403,
    );

    const rolesRead = await prisma.permission.findUniqueOrThrow({
      where: { key: "roles.read" },
    });
    await prisma.userHasPermission.create({
      data: {
        userId: managerUser.id,
        permissionId: rolesRead.id,
      },
    });
    assert.equal(
      (
        await request("/api/admin/roles", {
          headers: managerAuthorization,
        })
      ).status,
      200,
    );

    const updatedRoleResponse = await request(`/api/admin/roles/${role.id}`, {
      method: "PATCH",
      headers: adminAuthorization,
      body: JSON.stringify({
        permissionKeys: ["admin.access", "users.read", "users.create"],
      }),
    });
    assert.equal(updatedRoleResponse.status, 200);

    const createdByManager = await request("/api/admin/users", {
      method: "POST",
      headers: managerAuthorization,
      body: JSON.stringify({
        name: "Created By Manager",
        email: "created-by-manager@example.com",
        password: "Created123",
        roles: ["member"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(createdByManager.status, 201);
    const managedUser = (await createdByManager.json()) as { id: number };

    const privilegeEscalation = await request("/api/admin/users", {
      method: "POST",
      headers: managerAuthorization,
      body: JSON.stringify({
        name: "Escalation Attempt",
        email: "escalation-attempt@example.com",
        password: "Escalate123",
        roles: ["admin"],
        permissions: [],
        status: "active",
      }),
    });
    assert.equal(privilegeEscalation.status, 403);
    assert.equal(
      (
        await request(`/api/admin/users/${managedUser.id}/status`, {
          method: "PATCH",
          headers: managerAuthorization,
          body: JSON.stringify({ status: "disabled" }),
        })
      ).status,
      403,
    );

    assert.equal(
      (
        await request(`/api/admin/roles/${role.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    for (const id of [managedUser.id, managerUser.id]) {
      assert.equal(
        (
          await request(`/api/admin/users/${id}`, {
            method: "DELETE",
            headers: adminAuthorization,
          })
        ).status,
        200,
      );
    }
    assert.equal(
      (
        await request(`/api/admin/roles/${role.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
  });
});

describe("Languages E2E", () => {
  it("manages published locales and preserves exactly one default", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const createdResponse = await request("/api/admin/languages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        name: "Japanese",
        nativeName: "日本語",
        locale: "ja",
        code: "ja",
        regional: "ja-JP",
        flag: "JP",
        isDefault: false,
        status: "published",
        sortOrder: 30,
        isRtl: false,
      }),
    });
    assert.equal(
      createdResponse.status,
      201,
      await createdResponse.clone().text(),
    );
    const japanese = (await createdResponse.json()) as { id: number };

    assert.equal(
      (
        await request("/api/admin/languages", {
          method: "POST",
          headers: authorization,
          body: JSON.stringify({
            name: "Duplicate Japanese",
            locale: "ja",
            code: "jx",
            isDefault: false,
            status: "published",
            sortOrder: 40,
            isRtl: false,
          }),
        })
      ).status,
      409,
    );

    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}/default`, {
          method: "PATCH",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}`, {
          method: "PATCH",
          headers: authorization,
          body: JSON.stringify({ status: "draft" }),
        })
      ).status,
      400,
    );
    const publicResponse = await request("/api/languages");
    assert.equal(publicResponse.status, 200);
    assert.equal(
      ((await publicResponse.json()) as { defaultLocale: string })
        .defaultLocale,
      "ja",
    );
    const missingDefaultTranslation = await request(
      "/api/admin/payment-methods",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({
          withdrawFee: "0",
          minWithdrawAmount: "1000",
          status: "published",
          translations: [
            {
              locale: "vi",
              name: "Ngân hàng",
              fields: [
                {
                  key: "account_number",
                  label: "Số tài khoản",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        }),
      },
    );
    assert.equal(missingDefaultTranslation.status, 400);
    const localizedMethodResponse = await request(
      "/api/admin/payment-methods",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({
          withdrawFee: "0",
          minWithdrawAmount: "1000",
          status: "published",
          translations: [
            {
              locale: "ja",
              name: "銀行振込",
              fields: [
                {
                  key: "account_number",
                  label: "口座番号",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        }),
      },
    );
    assert.equal(
      localizedMethodResponse.status,
      201,
      await localizedMethodResponse.clone().text(),
    );
    const localizedMethod = (await localizedMethodResponse.json()) as {
      id: number;
    };
    assert.equal(
      (
        await request(
          `/api/admin/payment-methods/${localizedMethod.id}`,
          {
            method: "DELETE",
            headers: authorization,
          },
        )
      ).status,
      200,
    );

    const vietnamese = await prisma.language.findUniqueOrThrow({
      where: { locale: "vi" },
    });
    assert.equal(
      (
        await request(`/api/admin/languages/${vietnamese.id}/default`, {
          method: "PATCH",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${vietnamese.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      409,
    );
  });
});

describe("Currencies and user meta E2E", () => {
  it("manages USD-based rates and persists the member currency preference", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal(
      (await request("/api/admin/settings/currencies")).status,
      401,
    );

    const createdResponse = await request("/api/admin/settings/currencies", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        code: "VND",
        name: "Vietnamese đồng",
        symbol: "₫",
        exchangeRate: "22000",
        decimalDigits: 0,
        isDefault: false,
        isActive: true,
        sortOrder: 20,
      }),
    });
    assert.equal(
      createdResponse.status,
      201,
      await createdResponse.clone().text(),
    );
    const vnd = (await createdResponse.json()) as {
      id: number;
      exchangeRate: string;
    };
    assert.equal(vnd.exchangeRate, "22000");

    const memberSession = await login();
    const memberAuthorization = {
      Authorization: `Bearer ${memberSession.body.accessToken}`,
    };
    const preferenceResponse = await request(
      "/api/member/preferences/currency",
      {
        method: "PATCH",
        headers: memberAuthorization,
        body: JSON.stringify({ currency: "VND" }),
      },
    );
    assert.equal(
      preferenceResponse.status,
      200,
      await preferenceResponse.clone().text(),
    );
    assert.equal(
      ((await preferenceResponse.json()) as { currency: string }).currency,
      "VND",
    );
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    assert.equal(
      (
        await prisma.userMeta.findUniqueOrThrow({
          where: {
            userId_key: {
              userId: owner.id,
              key: "preferences.currency",
            },
          },
        })
      ).valueJson,
      JSON.stringify("VND"),
    );
    assert.equal(
      (
        await request(`/api/admin/settings/currencies/${vnd.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    const updateResponse = await request(
      `/api/admin/settings/currencies/${vnd.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ exchangeRate: "22500.5" }),
      },
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(
      ((await updateResponse.json()) as { exchangeRate: string })
        .exchangeRate,
      "22500.5",
    );

    const usd = await prisma.currency.findUniqueOrThrow({
      where: { code: "USD" },
    });
    assert.equal(
      (
        await request(`/api/admin/settings/currencies/${usd.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    await prisma.userMeta.deleteMany({
      where: {
        userId: owner.id,
        key: "preferences.currency",
      },
    });
    assert.equal(
      (
        await request(`/api/admin/settings/currencies/${vnd.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
  });
});

describe("Payment methods E2E", () => {
  it("supports admin catalog CRUD and ownership-scoped member accounts", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const translations = [
      {
        locale: "vi",
        name: "Chuyển khoản ngân hàng",
        fields: [
          {
            key: "account_name",
            label: "Tên chủ tài khoản",
            type: "text",
            required: true,
          },
          {
            key: "account_number",
            label: "Số tài khoản",
            type: "text",
            required: true,
          },
        ],
      },
      {
        locale: "en",
        name: "Bank transfer",
        fields: [
          {
            key: "account_name",
            label: "Account holder",
            type: "text",
            required: true,
          },
          {
            key: "account_number",
            label: "Account number",
            type: "text",
            required: true,
          },
        ],
      },
    ];
    const createdResponse = await request("/api/admin/payment-methods", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        withdrawFee: "5.25",
        minWithdrawAmount: "100000",
        status: "published",
        translations,
      }),
    });
    assert.equal(
      createdResponse.status,
      201,
      await createdResponse.clone().text(),
    );
    const method = (await createdResponse.json()) as {
      id: number;
      withdrawFee: string;
      userMethodCount: number;
    };
    assert.equal(method.withdrawFee, "5.25");
    assert.equal(method.userMethodCount, 0);

    for (const [email, name] of [
      ["payment-owner@example.com", "Payment Owner"],
      ["payment-other@example.com", "Payment Other"],
    ]) {
      const registration = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password: "Secure123" }),
      });
      assert.equal(registration.status, 201);
    }
    const owner = await loginAs("payment-owner@example.com", "Secure123");
    const other = await loginAs("payment-other@example.com", "Secure123");
    const ownerAuthorization = {
      Authorization: `Bearer ${owner.body.accessToken}`,
    };
    const otherAuthorization = {
      Authorization: `Bearer ${other.body.accessToken}`,
    };

    const invalidAccount = await request("/api/member/payment-methods", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        paymentMethodId: method.id,
        details: { account_name: "Test Owner" },
      }),
    });
    assert.equal(invalidAccount.status, 400);

    const accountResponse = await request("/api/member/payment-methods", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        paymentMethodId: method.id,
        details: {
          account_name: "Test Owner",
          account_number: "123456789",
        },
      }),
    });
    assert.equal(
      accountResponse.status,
      201,
      await accountResponse.clone().text(),
    );
    const account = (await accountResponse.json()) as {
      id: number;
      details: Record<string, string>;
    };
    assert.equal(account.details.account_number, "123456789");

    const dashboard = await request("/api/member/payment-methods", {
      headers: ownerAuthorization,
    });
    assert.equal(dashboard.status, 200);
    const dashboardBody = (await dashboard.json()) as {
      catalog: unknown[];
      accounts: unknown[];
    };
    assert.equal(dashboardBody.catalog.length, 1);
    assert.equal(dashboardBody.accounts.length, 1);

    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "PATCH",
          headers: otherAuthorization,
          body: JSON.stringify({
            details: {
              account_name: "Intruder",
              account_number: "0000",
            },
          }),
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "DELETE",
          headers: otherAuthorization,
        })
      ).status,
      404,
    );

    const incompatibleUpdate = await request(
      `/api/admin/payment-methods/${method.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({
          translations: translations.map((translation) => ({
            ...translation,
            fields: translation.fields.slice(0, 1),
          })),
        }),
      },
    );
    assert.equal(incompatibleUpdate.status, 409);
    assert.equal(
      (
        await request(`/api/admin/payment-methods/${method.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "PATCH",
          headers: ownerAuthorization,
          body: JSON.stringify({
            details: {
              account_name: "Updated Owner",
              account_number: "987654321",
            },
          }),
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "DELETE",
          headers: ownerAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/payment-methods/${method.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
  });
});

describe("Withdrawals E2E", () => {
  it("debits once, handles idempotency and refunds only cancelled or rejected requests", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const referrerRegistration = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "withdrawal-referrer@example.com",
        name: "Withdrawal Referrer",
        password: "Secure123",
      }),
    });
    assert.equal(referrerRegistration.status, 201);
    const referrer = await prisma.user.findUniqueOrThrow({
      where: { email: "withdrawal-referrer@example.com" },
    });
    assert.ok(referrer.referralCode);
    const referrerSession = await loginAs(
      "withdrawal-referrer@example.com",
      "Secure123",
    );
    const referrerAuthorization = {
      Authorization: `Bearer ${referrerSession.body.accessToken}`,
    };

    const registration = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "withdrawal-owner@example.com",
        name: "Withdrawal Owner",
        password: "Secure123",
        referralCode: referrer.referralCode,
      }),
    });
    assert.equal(registration.status, 201);
    const member = await loginAs(
      "withdrawal-owner@example.com",
      "Secure123",
    );
    const memberAuthorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };
    const owner = await prisma.user.update({
      where: { email: "withdrawal-owner@example.com" },
      data: { balance: "1000000" },
    });
    const method = await prisma.paymentMethod.create({
      data: {
        withdrawFee: "10000",
        minWithdrawAmount: "100000",
        status: "published",
        translations: {
          create: {
            locale: "vi",
            name: "Ngân hàng kiểm thử",
            fieldsJson: "[]",
          },
        },
      },
    });
    const account = await prisma.userPaymentMethod.create({
      data: {
        userId: owner.id,
        paymentMethodId: method.id,
        detailsJson: JSON.stringify({
          account_name: "Withdrawal Owner",
          account_number: "123456789",
        }),
      },
    });

    const estimate = await request("/api/member/withdrawals/estimate", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify({
        amount: "300000",
        userPaymentMethodId: account.id,
      }),
    });
    assert.equal(estimate.status, 201, await estimate.clone().text());
    assert.deepEqual(await estimate.json(), {
      requestedAmount: "300000",
      feeAmount: "10000",
      netAmount: "290000",
    });

    const firstPayload = {
      amount: "300000",
      userPaymentMethodId: account.id,
      idempotencyKey: "withdrawal-test-key-0001",
    };
    const firstResponse = await request("/api/member/withdrawals", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify(firstPayload),
    });
    assert.equal(firstResponse.status, 201, await firstResponse.clone().text());
    const first = (await firstResponse.json()) as {
      id: number;
      currency: string;
      status: string;
      netAmount: string;
    };
    assert.equal(first.currency, "USD");
    assert.equal(first.status, "pending");
    assert.equal(first.netAmount, "290000");
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })
      ).balance.toString(),
      "700000",
    );

    const duplicate = await request("/api/member/withdrawals", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify(firstPayload),
    });
    assert.equal(duplicate.status, 201);
    assert.equal(((await duplicate.json()) as { id: number }).id, first.id);
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })
      ).balance.toString(),
      "700000",
    );

    const createRequest = async (key: string, amount: string) => {
      const response = await request("/api/member/withdrawals", {
        method: "POST",
        headers: memberAuthorization,
        body: JSON.stringify({
          amount,
          userPaymentMethodId: account.id,
          idempotencyKey: key,
        }),
      });
      assert.equal(response.status, 201, await response.clone().text());
      return (await response.json()) as { id: number; status: string };
    };

    const paid = await createRequest("withdrawal-test-key-0002", "200000");
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${paid.id}/process`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    const paidResponse = await request(
      `/api/admin/withdrawals/${paid.id}/paid`,
      { method: "PATCH", headers: adminAuthorization },
    );
    assert.equal(paidResponse.status, 200);
    assert.equal(
      ((await paidResponse.json()) as { status: string }).status,
      "paid",
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: referrer.id } })
      ).balance.toString(),
      "9500",
    );
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${paid.id}/paid`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: referrer.id } })
      ).balance.toString(),
      "9500",
    );

    const rejected = await createRequest(
      "withdrawal-test-key-0003",
      "100000",
    );
    const rejectResponse = await request(
      `/api/admin/withdrawals/${rejected.id}/reject`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ statusReason: "Thông tin nhận tiền không đúng." }),
      },
    );
    assert.equal(rejectResponse.status, 200);
    const rejectedBody = (await rejectResponse.json()) as {
      status: string;
      statusReason: string;
      processedBy: { id: number };
      processedAt: string;
    };
    assert.equal(rejectedBody.status, "rejected");
    assert.equal(
      rejectedBody.statusReason,
      "Thông tin nhận tiền không đúng.",
    );
    assert.ok(rejectedBody.processedBy.id);
    assert.ok(rejectedBody.processedAt);

    const cancelResponse = await request(
      `/api/member/withdrawals/${first.id}/cancel`,
      { method: "PATCH", headers: memberAuthorization },
    );
    assert.equal(cancelResponse.status, 200);
    assert.equal(
      ((await cancelResponse.json()) as { status: string }).status,
      "cancelled",
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })
      ).balance.toString(),
      "800000",
    );
    assert.equal(
      (
        await request(`/api/member/withdrawals/${first.id}/cancel`, {
          method: "PATCH",
          headers: memberAuthorization,
        })
      ).status,
      409,
    );

    const secondPaid = await createRequest(
      "withdrawal-test-key-0004",
      "100000",
    );
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${secondPaid.id}/process`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${secondPaid.id}/paid`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: referrer.id } })
      ).balance.toString(),
      "14000",
    );
    const commissions = await prisma.commission.findMany({
      where: { userId: referrer.id },
      orderBy: { amount: "asc" },
    });
    assert.equal(commissions.length, 2);
    assert.deepEqual(
      commissions.map((commission) => [
        commission.amount.toString(),
        commission.rate.toString(),
        commission.commissionableType,
      ]),
      [
        ["4500", "5", "user_withdrawal"],
        ["9500", "5", "user_withdrawal"],
      ],
    );

    const dashboardResponse = await request(
      "/api/member/withdrawals/dashboard",
      { headers: memberAuthorization },
    );
    assert.equal(dashboardResponse.status, 200);
    const dashboard = (await dashboardResponse.json()) as {
      currency: string;
      availableBalance: string;
      pendingBalance: string;
      totalReceived: string;
      withdrawals: unknown[];
    };
    assert.equal(dashboard.currency, "USD");
    assert.equal(dashboard.availableBalance, "700000");
    assert.equal(dashboard.pendingBalance, "0");
    assert.equal(dashboard.totalReceived, "280000");
    assert.equal(dashboard.withdrawals.length, 4);

    const referralsDashboardResponse = await request(
      "/api/member/referrals/dashboard",
      { headers: referrerAuthorization },
    );
    assert.equal(
      referralsDashboardResponse.status,
      200,
      await referralsDashboardResponse.clone().text(),
    );
    const referralsDashboard = (await referralsDashboardResponse.json()) as {
      currency: string;
      commissionRate: string;
      summary: {
        totalReferrals: number;
        totalCommission: string;
        successfulWithdrawals: number;
      };
      referrals: Array<{
        id: number;
        successfulWithdrawals: number;
        totalCommission: string;
      }>;
      recentCommissions: Array<{
        amount: string;
        withdrawalId: number;
      }>;
    };
    assert.equal(referralsDashboard.currency, "USD");
    assert.equal(referralsDashboard.commissionRate, "5.00");
    assert.deepEqual(referralsDashboard.summary, {
      totalReferrals: 1,
      totalCommission: "14000",
      successfulWithdrawals: 2,
    });
    assert.equal(referralsDashboard.referrals[0]?.id, owner.id);
    assert.equal(
      referralsDashboard.referrals[0]?.successfulWithdrawals,
      2,
    );
    assert.equal(referralsDashboard.referrals[0]?.totalCommission, "14000");
    assert.deepEqual(
      new Set(
        referralsDashboard.recentCommissions.map(
          (commission) => commission.withdrawalId,
        ),
      ),
      new Set([paid.id, secondPaid.id]),
    );

    const adminListResponse = await request(
      "/api/admin/withdrawals?status=paid,rejected&search=Withdrawal%20Owner&sortBy=amount&sortOrder=asc&page=1&perPage=10",
      { headers: adminAuthorization },
    );
    assert.equal(
      adminListResponse.status,
      200,
      await adminListResponse.clone().text(),
    );
    const adminList = (await adminListResponse.json()) as {
      items: Array<{ amount: string; currency: string; status: string }>;
      total: number;
      pageCount: number;
    };
    assert.equal(adminList.total, 3);
    assert.equal(adminList.pageCount, 1);
    assert.ok(adminList.items.every((item) => item.currency === "USD"));
    assert.deepEqual(
      adminList.items
        .map((item) => [item.amount, item.status])
        .sort(([leftAmount, leftStatus], [rightAmount, rightStatus]) =>
          `${leftAmount}:${leftStatus}`.localeCompare(
            `${rightAmount}:${rightStatus}`,
          ),
        ),
      [
        ["100000", "paid"],
        ["100000", "rejected"],
        ["200000", "paid"],
      ].sort(([leftAmount, leftStatus], [rightAmount, rightStatus]) =>
        `${leftAmount}:${leftStatus}`.localeCompare(
          `${rightAmount}:${rightStatus}`,
        ),
      ),
    );

    await prisma.userWithdrawal.deleteMany({ where: { userId: owner.id } });
    await prisma.userPaymentMethod.delete({ where: { id: account.id } });
    await prisma.paymentMethod.delete({ where: { id: method.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.user.delete({ where: { id: referrer.id } });
  });
});

describe("Website menus E2E", () => {
  it("publishes localized snapshots, protects versions and manages locations", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/menus")).status, 401);

    const createResponse = await request("/api/admin/menus", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        key: `e2e-menu-${process.pid}`,
        name: "Menu E2E",
        description: "Menu dùng cho kiểm thử.",
        translations: [{ locale: "vi", title: "Điều hướng E2E" }],
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      draftVersion: number;
    };
    assert.equal(created.draftVersion, 1);

    const unsafeTree = await request(
      `/api/admin/menus/${created.id}/tree`,
      {
        method: "PUT",
        headers: authorization,
        body: JSON.stringify({
          expectedVersion: 1,
          items: [
            {
              type: "CUSTOM_URL",
              url: "javascript:alert(1)",
              target: "SELF",
              isEnabled: true,
              translations: [{ locale: "vi", label: "Không an toàn" }],
              children: [],
            },
          ],
        }),
      },
    );
    assert.equal(unsafeTree.status, 400);

    const treeResponse = await request(
      `/api/admin/menus/${created.id}/tree`,
      {
        method: "PUT",
        headers: authorization,
        body: JSON.stringify({
          expectedVersion: 1,
          items: [
            {
              type: "CUSTOM_URL",
              url: "/e2e",
              target: "BLANK",
              isEnabled: true,
              translations: [{ locale: "vi", label: "Kiểm thử" }],
              children: [],
            },
          ],
        }),
      },
    );
    assert.equal(treeResponse.status, 200, await treeResponse.clone().text());
    assert.equal(
      ((await treeResponse.json()) as { draftVersion: number }).draftVersion,
      2,
    );

    const staleResponse = await request(
      `/api/admin/menus/${created.id}/tree`,
      {
        method: "PUT",
        headers: authorization,
        body: JSON.stringify({ expectedVersion: 1, items: [] }),
      },
    );
    assert.equal(staleResponse.status, 409);
    assert.equal(
      ((await staleResponse.json()) as { code: string }).code,
      "MENU_VERSION_CONFLICT",
    );

    const publishResponse = await request(
      `/api/admin/menus/${created.id}/publish`,
      { method: "POST", headers: authorization },
    );
    assert.equal(publishResponse.status, 201);

    const assignmentResponse = await request("/api/admin/menus/locations", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        location: "header-primary",
        menuId: created.id,
      }),
    });
    assert.equal(assignmentResponse.status, 200);

    const publicResponse = await request(
      "/api/website/menus?locations=header-primary&locale=en",
    );
    assert.equal(publicResponse.status, 200);
    const publicBody = (await publicResponse.json()) as {
      menus: {
        "header-primary": {
          items: Array<{ label: string; rel: string; target: string }>;
        };
      };
    };
    assert.equal(publicBody.menus["header-primary"].items[0]?.label, "Kiểm thử");
    assert.equal(publicBody.menus["header-primary"].items[0]?.target, "_blank");
    assert.equal(
      publicBody.menus["header-primary"].items[0]?.rel,
      "noopener noreferrer",
    );

    const inUseDelete = await request(`/api/admin/menus/${created.id}`, {
      method: "DELETE",
      headers: authorization,
    });
    assert.equal(inUseDelete.status, 409);
    assert.equal(
      ((await inUseDelete.json()) as { code: string }).code,
      "MENU_IN_USE",
    );

    assert.equal(
      (
        await request("/api/admin/menus/locations/header-primary", {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/menus/${created.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
  });
});

describe("Support tickets E2E", () => {
  it("supports member ownership and a complete admin response lifecycle", async () => {
    const email = `support-member-${process.pid}@example.com`;
    const password = "Support123";
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: "Support Member",
            email,
            password,
          }),
        })
      ).status,
      201,
    );
    const member = await loginAs(email, password);
    const memberAuthorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };

    const createResponse = await request("/api/member/support/tickets", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify({
        category: "technical",
        subject: "Không thể cập nhật social link",
        content:
          "Tôi đã thử lưu lại social link nhiều lần nhưng trạng thái không thay đổi.",
        relatedResource: "/member/links",
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      reference: string;
      status: string;
      messages: Array<{ senderRole: string; isInternal: boolean }>;
    };
    assert.match(created.reference, /^TKT-\d{4}-\d{6}$/);
    assert.equal(created.status, "submitted");

    const otherEmail = `support-other-${process.pid}@example.com`;
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: "Other Support Member",
            email: otherEmail,
            password,
          }),
        })
      ).status,
      201,
    );
    const otherMember = await loginAs(otherEmail, password);
    assert.equal(
      (
        await request(`/api/member/support/tickets/${created.id}`, {
          headers: {
            Authorization: `Bearer ${otherMember.body.accessToken}`,
          },
        })
      ).status,
      404,
    );

    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const listResponse = await request(
      "/api/admin/support/tickets?status=submitted",
      { headers: adminAuthorization },
    );
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()) as {
      items: Array<{ id: number }>;
      summary: { open: number; unassigned: number };
    };
    assert.ok(list.items.some((ticket) => ticket.id === created.id));
    assert.ok(list.summary.open >= 1);
    assert.ok(list.summary.unassigned >= 1);

    const assignResponse = await request(
      `/api/admin/support/tickets/${created.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ assignToMe: true, priority: "high" }),
      },
    );
    assert.equal(assignResponse.status, 200);
    const assigned = (await assignResponse.json()) as {
      status: string;
      priority: string;
      assignedTo: { id: number };
    };
    assert.equal(assigned.status, "in_progress");
    assert.equal(assigned.priority, "high");
    assert.ok(assigned.assignedTo.id);

    const replyResponse = await request(
      `/api/admin/support/tickets/${created.id}/replies`,
      {
        method: "POST",
        headers: adminAuthorization,
        body: JSON.stringify({
          content:
            "Chúng tôi đã tiếp nhận. Bạn vui lòng thử tải lại trang trước khi lưu.",
        }),
      },
    );
    assert.equal(replyResponse.status, 201);
    assert.equal(
      ((await replyResponse.json()) as { status: string }).status,
      "waiting_user",
    );

    const memberDetail = await request(
      `/api/member/support/tickets/${created.id}`,
      { headers: memberAuthorization },
    );
    assert.equal(memberDetail.status, 200);
    const visible = (await memberDetail.json()) as {
      messages: Array<{ senderRole: string; isInternal: boolean }>;
    };
    assert.ok(
      visible.messages.some((message) => message.senderRole === "support"),
    );
    assert.equal(
      visible.messages.some((message) => message.isInternal),
      false,
    );

    const memberReply = await request(
      `/api/member/support/tickets/${created.id}/replies`,
      {
        method: "POST",
        headers: memberAuthorization,
        body: JSON.stringify({
          content: "Tôi đã thử lại và gửi thêm thông tin theo hướng dẫn.",
        }),
      },
    );
    assert.equal(memberReply.status, 201);
    assert.equal(
      ((await memberReply.json()) as { status: string }).status,
      "in_progress",
    );

    assert.equal(
      (
        await request(`/api/admin/support/tickets/${created.id}`, {
          method: "PATCH",
          headers: adminAuthorization,
          body: JSON.stringify({ status: "closed" }),
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/member/support/tickets/${created.id}/replies`, {
          method: "POST",
          headers: memberAuthorization,
          body: JSON.stringify({ content: "Phản hồi sau khi đóng." }),
        })
      ).status,
      409,
    );
  });
});

describe("Member Bio Pages E2E", () => {
  it("isolates owners, stores a JSON document and exposes only published pages", async () => {
    const ownerEmail = "bio-owner@example.com";
    const otherEmail = "bio-other@example.com";
    for (const [name, email] of [
      ["Bio Owner", ownerEmail],
      ["Bio Other", otherEmail],
    ]) {
      assert.equal(
        (
          await request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password: "Secure123" }),
          })
        ).status,
        201,
      );
    }

    const owner = await loginAs(ownerEmail, "Secure123");
    const other = await loginAs(otherEmail, "Secure123");
    const ownerAuthorization = {
      Authorization: `Bearer ${owner.body.accessToken}`,
    };
    const otherAuthorization = {
      Authorization: `Bearer ${other.body.accessToken}`,
    };
    const draftPayload = {
      name: "Creator Bio",
      title: "Creator",
      customSlug: "creator-bio-test",
      status: "draft",
      socialLinks: [
        {
          id: "social-1",
          platform: "Instagram",
          url: "https://instagram.com/example",
        },
      ],
      customLinks: [
        {
          id: "link-1",
          title: "Portfolio",
          url: "https://example.com/portfolio",
        },
      ],
      widgets: [],
      hiddenLinks: ["link-1"],
      appearance: {
        buttonStyle: "rounded",
        backgroundColor: "#ffffff",
      },
    };

    assert.equal(
      (
        await request("/api/member/bio-pages", {
          method: "POST",
          body: JSON.stringify(draftPayload),
        })
      ).status,
      401,
    );

    const createdResponse = await request("/api/member/bio-pages", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify(draftPayload),
    });
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()) as {
      id: string;
      slug: string;
      hiddenLinks: string[];
    };
    assert.deepEqual(created.hiddenLinks, ["link-1"]);

    const stored = await prisma.bioPage.findUniqueOrThrow({
      where: { id: created.id },
    });
    assert.equal(stored.userId, owner.body.user.id);
    assert.equal(
      (
        JSON.parse(stored.contentJson) as {
          customLinks: Array<{ id: string; isVisible: boolean }>;
        }
      ).customLinks[0].isVisible,
      false,
    );
    assert.equal(JSON.parse(stored.appearanceJson).buttonStyle, "rounded");

    const otherList = await request("/api/member/bio-pages", {
      headers: otherAuthorization,
    });
    assert.equal(otherList.status, 200);
    assert.deepEqual(await otherList.json(), []);
    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "PATCH",
          headers: otherAuthorization,
          body: JSON.stringify({ ...draftPayload, status: "published" }),
        })
      ).status,
      404,
    );
    assert.equal(
      (await request(`/api/public/bio-pages/${created.slug}`)).status,
      404,
    );

    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "PATCH",
          headers: ownerAuthorization,
          body: JSON.stringify({ ...draftPayload, status: "published" }),
        })
      ).status,
      200,
    );
    assert.equal(
      (await request(`/api/public/bio-pages/${created.slug}`)).status,
      200,
    );

    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "DELETE",
          headers: ownerAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (await request(`/api/public/bio-pages/${created.slug}`)).status,
      404,
    );
  });
});

describe("RolesGuard", () => {
  it("returns 403 when the current database-backed user lacks the required role", () => {
    const reflector = {
      getAllAndOverride: () => ["admin"],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "member" } }),
      }),
    };

    assert.throws(
      () => guard.canActivate(context as never),
      (error: unknown) =>
        error instanceof Error &&
        error.constructor.name === "ForbiddenException",
    );
  });
});

describe("PermissionsGuard", () => {
  it("returns 403 when a database-resolved permission is missing", () => {
    const reflector = {
      getAllAndOverride: () => ["users.delete"],
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { permissions: ["users.read"] } }),
      }),
    };

    assert.throws(
      () => guard.canActivate(context as never),
      (error: unknown) =>
        error instanceof Error &&
        error.constructor.name === "ForbiddenException",
    );
  });
});
