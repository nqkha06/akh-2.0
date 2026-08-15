import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "../../../src/modules/auth/guards/permissions.guard";
import assert from "node:assert/strict";
import { describe, it } from "node:test";


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

