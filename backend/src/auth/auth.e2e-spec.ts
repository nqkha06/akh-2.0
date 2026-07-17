import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NestFactory, Reflector } from "@nestjs/core";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import type { PrismaService } from "../prisma/prisma.service";
import { PermissionsGuard } from "./guards/permissions.guard";
import { RolesGuard } from "./guards/roles.guard";

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
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-longer-than-thirty-two-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-different-and-long-enough";
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
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
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
    import("../app.module"),
    import("../prisma/prisma.service"),
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
      body: JSON.stringify({ email: "auth@example.com", password: "Secure123" }),
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
    const expired = await jwtService.signAsync(
      payload,
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: -1 },
    );
    const expiredResponse = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${expired}` },
    });
    assert.equal(expiredResponse.status, 401);
  });

  it("rotates valid refresh tokens and revokes the session on old-token reuse", async () => {
    const current = await login();
    const refreshed = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(refreshed.status, 200);
    const rotatedCookie = refreshCookie(refreshed);
    assert.notEqual(rotatedCookie, current.cookie);

    const reuse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(reuse.status, 401);
    const rotatedAfterReuse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(rotatedAfterReuse.status, 401);
  });

  it("rejects expired, malformed and revoked refresh tokens", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    delete payload.exp;
    delete payload.iat;
    const expired = await jwtService.signAsync(
      payload,
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: -1 },
    );
    assert.equal(
      (
        await request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: `stu_refresh_token=${expired}` },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: "stu_refresh_token=not-a-jwt" },
        })
      ).status,
      401,
    );

    await prisma.authSession.update({
      where: { id: payload.sid },
      data: { revokedAt: new Date() },
    });
    assert.equal(
      (
        await request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: current.cookie },
        })
      ).status,
      401,
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
    assert.equal((await request("/api/auth/logout", { method: "POST" })).status, 204);
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
    const created = (await createdResponse.json()) as Record<string, unknown> & {
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
    assert.equal(
      ((await orResponse.json()) as { total: number }).total,
      1,
    );

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

    assert.equal(
      (await request("/api/admin/social-links")).status,
      401,
    );

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
    assert.equal(
      ((await deletedList.json()) as { total: number }).total,
      1,
    );

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
    assert.ok(permissions.some((permission) => permission.key === "users.read"));

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
        error instanceof Error && error.constructor.name === "ForbiddenException",
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
