import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { userEditorFormSchema } from "./user-schema.ts";

describe("Admin Users form schema", () => {
  it("validates create passwords and normalized account fields", () => {
    const valid = userEditorFormSchema.safeParse({
      mode: "create",
      name: "  Nguyễn Văn A  ",
      email: "  ADMIN@EXAMPLE.COM ",
      avatar: "https://example.com/avatar.png",
      password: "Secure123",
      confirmPassword: "Secure123",
      roles: ["member"],
      permissions: [],
      status: "active",
      emailVerified: false,
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.name, "Nguyễn Văn A");
      assert.equal(valid.data.email, "admin@example.com");
    }
  });

  it("rejects duplicate-password mistakes and invalid URLs", () => {
    const invalid = userEditorFormSchema.safeParse({
      mode: "create",
      name: "Admin",
      email: "admin@example.com",
      avatar: "invalid-url",
      password: "weak",
      confirmPassword: "different",
      roles: [],
      permissions: [],
      status: "active",
      emailVerified: false,
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      const fields = new Set(invalid.error.issues.map((issue) => issue.path[0]));
      assert.equal(fields.has("avatar"), true);
      assert.equal(fields.has("password"), true);
      assert.equal(fields.has("confirmPassword"), true);
      assert.equal(fields.has("roles"), true);
    }
  });
});
