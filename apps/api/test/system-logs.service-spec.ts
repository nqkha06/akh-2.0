import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PERMISSIONS_KEY } from "../src/modules/auth/decorators/permissions.decorator";
import { AdminSystemLogsService } from "../src/modules/system-logs/admin-system-logs.service";
import { buildSystemLogsListQuery } from "../src/modules/system-logs/queries/system-logs-list-query.builder";
import {
  sanitizeSystemLogMetadata,
  sanitizeSystemLogText,
} from "../src/modules/system-logs/system-log-sanitizer";
import { SystemLogsController } from "../src/modules/system-logs/system-logs.controller";

describe("System Logs", () => {
  it("masks secrets recursively without changing useful metadata", () => {
    const output = sanitizeSystemLogMetadata({
      password: "hunter2",
      nested: { access_token: "jwt", amount: 125, ok: true },
    }) as Record<string, unknown>;
    assert.equal(output.password, "[REDACTED]");
    assert.deepEqual(output.nested, {
      access_token: "[REDACTED]",
      amount: 125,
      ok: true,
    });
    const sanitizedText = sanitizeSystemLogText(
      "Authorization: Bearer abc.def.ghi",
    );
    assert.match(sanitizedText, /\[REDACTED\]/);
    assert.doesNotMatch(sanitizedText, /abc\.def\.ghi/);
  });

  it("builds paginated filters with newest-first ordering", () => {
    const result = buildSystemLogsListQuery({
      page: 3,
      perPage: 20,
      sortOrder: "desc",
      level: "error",
      category: "security",
      context: "AuthService",
      event: "login_failed",
      keyword: "blocked",
      user: "admin@example.com",
    });
    assert.equal(result.skip, 40);
    assert.equal(result.take, 20);
    assert.deepEqual(result.orderBy, { createdAt: "desc" });
    assert.equal(result.where.level, "error");
    assert.equal(result.where.category, "SECURITY");
    assert.ok(Array.isArray(result.where.AND));
  });

  it("counts cleanup candidates before deleting", async () => {
    const repository = {
      count: async () => 42,
      deleteWhereInBatches: async () => ({ count: 42 }),
    };
    const service = new AdminSystemLogsService(repository as never);
    assert.deepEqual(
      await service.cleanup({ mode: "older_than", days: 30, dryRun: true }),
      { dryRun: true, matchedCount: 42, deletedCount: 0 },
    );
    assert.deepEqual(
      await service.cleanup({ mode: "older_than", days: 30, dryRun: false }),
      { dryRun: false, matchedCount: 42, deletedCount: 42 },
    );
  });

  it("protects destructive endpoints with the delete permission", () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      SystemLogsController.prototype.deleteOne,
    );
    assert.deepEqual(permissions, ["system_logs.delete"]);
  });
});
