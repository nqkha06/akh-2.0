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
process.env.DATABASE_URL = `file:./${testDatabaseName}`;
process.env.JWT_ACCESS_SECRET =
  "test-access-secret-that-is-longer-than-thirty-two-characters";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-that-is-different-and-long-enough";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.AUTH_COOKIE_SECURE = "false";
process.env.AUTH_COOKIE_SAME_SITE = "lax";

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
  const header = response.headers.get("set-cookie");
  const match = /stu_refresh_token=([^;]+)/.exec(header || "");
  assert.ok(match, "response must set a refresh-token cookie");
  return `stu_refresh_token=${match[1]}`;
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
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

  it("accepts a valid access token and rejects missing or expired tokens", async () => {
    const current = await login();
    const me = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${current.body.accessToken}` },
    });
    assert.equal(me.status, 200);
    const user = (await me.json()) as Record<string, unknown>;
    assert.equal("passwordHash" in user, false);
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
    assert.equal(
      (
        await request("/api/auth/logout", {
          method: "POST",
          headers: { Cookie: current.cookie },
        })
      ).status,
      204,
    );
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

  it("logout-all invalidates every device session", async () => {
    const first = await login();
    const second = await login();
    const response = await request("/api/auth/logout-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${first.body.accessToken}` },
    });
    assert.equal(response.status, 204);

    for (const cookie of [first.cookie, second.cookie]) {
      const refresh = await request("/api/auth/refresh", {
        method: "POST",
        headers: { Cookie: cookie },
      });
      assert.equal(refresh.status, 401);
    }
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
      totalClicks: number;
    };
    assert.equal(list.total, 1);
    assert.equal(list.items[0]?.id, link.id);
    assert.equal(list.items[0]?.owner.email, "auth@example.com");
    assert.equal(list.items[0]?.actionsCount, 1);
    assert.equal(list.totalClicks, 0);

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

describe("Admin monetization levels E2E", () => {
  const payload = (key: string, isDefault = false) => ({
    key,
    status: "active",
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
        activeLevels: number;
        configuredRoutes: number;
        configuredRates: number;
        assignedUsers: number;
      };
    };
    assert.equal(listResult.total, 2);
    assert.equal(listResult.summary.activeLevels, 2);
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
        status: "active",
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
      (await prisma.link.findUniqueOrThrow({ where: { id: link.id } })).clicks,
      4,
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });

  it("keeps file destinations separate from the monetization redirect", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "public-file-route-resolution",
        status: "active",
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
    assert.equal(createManagerResponse.status, 201);
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
  it("manages enabled locales and preserves exactly one default", async () => {
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
        isEnabled: true,
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
            isEnabled: true,
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
          body: JSON.stringify({ isEnabled: false }),
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
          status: "active",
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
          status: "active",
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
        status: "active",
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
