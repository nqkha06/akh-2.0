import { Reflector } from "@nestjs/core";
import { RolesGuard } from "../../../src/modules/auth/guards/roles.guard";
import assert from "node:assert/strict";
import { describe, it } from "node:test";


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

