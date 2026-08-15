import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AuthResponse } from "../e2e-harness";
import {
  accessCookie,
  decodeJwt,
  login,
  loginAs,
  prisma,
  request,
  setAdminAccessToken,
} from "../e2e-harness";

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
    setAdminAccessToken(current.body.accessToken);

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

    const managedLogin = await loginAs("managed@example.com", "Managed123");
    const sessionPayload = decodeJwt(managedLogin.body.accessToken);

    const impersonationAdmin = await login();
    const impersonationStart = await request(
      `/api/auth/impersonation/${created.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${impersonationAdmin.body.accessToken}`,
          Origin: "http://localhost:3000",
        },
      },
    );
    assert.equal(
      impersonationStart.status,
      200,
      await impersonationStart.clone().text(),
    );
    const impersonationBody = (await impersonationStart.json()) as AuthResponse & {
      user: {
        id: number;
        permissions: string[];
        impersonation: { actorId: number } | null;
      };
    };
    assert.equal(impersonationBody.user.id, created.id);
    assert.equal(impersonationBody.user.impersonation?.actorId, currentUser.id);
    assert.equal(impersonationBody.user.permissions.includes("admin.access"), false);
    accessCookie(impersonationStart);

    const impersonatedMe = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${impersonationBody.accessToken}` },
    });
    assert.equal(impersonatedMe.status, 200);
    assert.equal(
      ((await impersonatedMe.json()) as { id: number }).id,
      created.id,
    );
    assert.equal(
      (
        await request("/api/admin/users", {
          headers: { Authorization: `Bearer ${impersonationBody.accessToken}` },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(`/api/auth/impersonation/${currentUser.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${impersonationBody.accessToken}`,
            Origin: "http://localhost:3000",
          },
        })
      ).status,
      403,
    );

    const impersonationSession = await prisma.authSession.findFirstOrThrow({
      where: { userId: created.id, authMethod: "impersonation" },
    });
    assert.equal(impersonationSession.impersonatorUserId, currentUser.id);
    assert.equal(
      impersonationSession.impersonatorSessionId,
      decodeJwt(impersonationAdmin.body.accessToken).sid,
    );

    const impersonationStop = await request("/api/auth/impersonation/stop", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${impersonationBody.accessToken}`,
        Origin: "http://localhost:3000",
      },
    });
    assert.equal(impersonationStop.status, 200);
    const restoredBody = (await impersonationStop.json()) as AuthResponse & {
      user: { id: number; impersonation: null };
    };
    assert.equal(restoredBody.user.id, currentUser.id);
    assert.equal(restoredBody.user.impersonation, null);
    accessCookie(impersonationStop);
    assert.equal(
      (
        await prisma.authSession.findUniqueOrThrow({
          where: { id: impersonationSession.id },
        })
      ).revokedAt instanceof Date,
      true,
    );
    assert.equal(
      (
        await request("/api/auth/impersonation/stop", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${current.body.accessToken}`,
            Origin: "http://localhost:3000",
          },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(`/api/auth/impersonation/${created.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${managedLogin.body.accessToken}`,
            Origin: "http://localhost:3000",
          },
        })
      ).status,
      403,
    );

    const sessionsResponse = await request(
      `/api/admin/users/${created.id}/sessions`,
      { headers: authorization },
    );
    assert.equal(sessionsResponse.status, 200);
    const sessionsBody = (await sessionsResponse.json()) as {
      items: Array<{
        id: string;
        authMethod: string;
        status: string;
        isCurrent: boolean;
        refreshTokenHash?: string;
      }>;
    };
    const managedSession = sessionsBody.items.find(
      (session) => session.id === sessionPayload.sid,
    );
    assert.equal(managedSession?.authMethod, "password");
    assert.equal(managedSession?.status, "active");
    assert.equal(managedSession?.isCurrent, false);
    assert.equal("refreshTokenHash" in (managedSession || {}), false);

    const currentSessionPayload = decodeJwt(current.body.accessToken);
    const currentSessions = await request(
      `/api/admin/users/${currentUser.id}/sessions`,
      { headers: authorization },
    );
    assert.equal(currentSessions.status, 200);
    assert.equal(
      ((await currentSessions.json()) as typeof sessionsBody).items.some(
        (session) =>
          session.id === currentSessionPayload.sid && session.isCurrent,
      ),
      true,
    );

    const revokeOne = await request(
      `/api/admin/users/${created.id}/sessions/${sessionPayload.sid}/revoke`,
      { method: "POST", headers: authorization },
    );
    assert.equal(revokeOne.status, 201);
    assert.equal(
      ((await revokeOne.json()) as { revoked: boolean }).revoked,
      true,
    );
    assert.equal(
      (
        await request("/api/auth/me", {
          headers: { Authorization: `Bearer ${managedLogin.body.accessToken}` },
        })
      ).status,
      401,
    );

    const revokeCurrent = await request(
      `/api/admin/users/${currentUser.id}/sessions/${currentSessionPayload.sid}/revoke`,
      { method: "POST", headers: authorization },
    );
    assert.equal(revokeCurrent.status, 400);

    const systemFieldUpdate = await request(
      `/api/admin/users/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ createdAt: new Date().toISOString() }),
      },
    );
    assert.equal(systemFieldUpdate.status, 400);

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

