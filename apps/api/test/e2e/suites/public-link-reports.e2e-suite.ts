import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  prisma,
  request,
} from "../e2e-harness";

describe("Public link reports E2E", () => {
  it("accepts anonymous reports, validates input and deduplicates retries", async () => {
    const invalid = await request("/api/public/link-reports", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid-email",
        reportedUrl: "javascript:alert(1)",
        reason: "unknown",
        details: "too short",
      }),
    });
    assert.equal(invalid.status, 400);

    const payload = {
      email: "REPORTER@EXAMPLE.COM",
      reportedUrl: "https://example.com/l/suspicious#content",
      reason: "malware",
      details:
        "Trang này yêu cầu nhập thông tin đăng nhập và có dấu hiệu giả mạo.",
    };
    const createdResponse = await request("/api/public/link-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()) as {
      reference: string;
      createdAt: string;
    };
    assert.match(created.reference, /^RPT-\d{4}-[A-F0-9]{8}$/);
    assert.ok(created.createdAt);

    const stored = await prisma.linkReport.findUniqueOrThrow({
      where: { reference: created.reference },
    });
    assert.equal(stored.email, "reporter@example.com");
    assert.equal(stored.reason, "malware");
    assert.equal(stored.status, "pending");
    assert.equal(stored.reportedUrl, payload.reportedUrl);

    const duplicateResponse = await request("/api/public/link-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    assert.equal(duplicateResponse.status, 201);
    assert.equal(
      ((await duplicateResponse.json()) as { reference: string }).reference,
      created.reference,
    );
    assert.equal(
      await prisma.linkReport.count({
        where: { email: "reporter@example.com" },
      }),
      1,
    );

    await prisma.linkReport.deleteMany({
      where: { email: "reporter@example.com" },
    });
  });
});

