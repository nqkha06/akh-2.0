import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

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

