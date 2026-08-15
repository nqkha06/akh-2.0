import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  prisma,
  request,
} from "../e2e-harness";

describe("Admin link reports E2E", () => {
  it("enforces permissions and supports review, resolution and soft deletion", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const email = `admin-report-${process.pid}@example.com`;
    const createResponse = await request("/api/public/link-reports", {
      method: "POST",
      body: JSON.stringify({
        email,
        reportedUrl: "https://example.com/l/admin-review",
        reason: "impersonation",
        details:
          "Liên kết giả mạo trang đăng nhập và yêu cầu người xem cung cấp mật khẩu.",
      }),
    });
    assert.equal(createResponse.status, 201);
    const reference = (
      (await createResponse.json()) as { reference: string }
    ).reference;
    const stored = await prisma.linkReport.findUniqueOrThrow({
      where: { reference },
    });

    assert.equal(
      (await request("/api/admin/link-reports")).status,
      401,
    );

    const listResponse = await request(
      `/api/admin/link-reports?status=pending&search=${encodeURIComponent(reference)}&sortBy=email&sortOrder=asc`,
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200, await listResponse.clone().text());
    const list = (await listResponse.json()) as {
      items: Array<{ id: number; reference: string; status: string }>;
      pagination: { total: number; pageCount: number };
      summary: { pending: number; reviewing: number };
    };
    assert.equal(list.pagination.total, 1);
    assert.equal(list.pagination.pageCount, 1);
    assert.equal(list.items[0]?.id, stored.id);
    assert.equal(list.items[0]?.reference, reference);
    assert.ok(list.summary.pending >= 1);

    const detailResponse = await request(
      `/api/admin/link-reports/${stored.id}`,
      { headers: authorization },
    );
    assert.equal(detailResponse.status, 200);
    assert.equal(
      ((await detailResponse.json()) as { details: string }).details.includes(
        "giả mạo",
      ),
      true,
    );

    const invalidUpdate = await request(
      `/api/admin/link-reports/${stored.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "not-a-status" }),
      },
    );
    assert.equal(invalidUpdate.status, 400);

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: "admin" },
    });
    const managePermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "link-reports.manage" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: managePermission.id,
        },
      },
    });
    try {
      assert.equal(
        (
          await request(`/api/admin/link-reports/${stored.id}`, {
            method: "PATCH",
            headers: authorization,
            body: JSON.stringify({ status: "reviewing" }),
          })
        ).status,
        403,
      );
    } finally {
      await prisma.roleHasPermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: managePermission.id,
        },
      });
    }

    const reviewResponse = await request(
      `/api/admin/link-reports/${stored.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          status: "reviewing",
          resolutionNote: "Đang xác minh nội dung và đích đến của liên kết.",
        }),
      },
    );
    assert.equal(reviewResponse.status, 200);
    const reviewed = (await reviewResponse.json()) as {
      status: string;
      resolutionNote: string;
      reviewedBy: { id: number };
      resolvedAt: string | null;
    };
    assert.equal(reviewed.status, "reviewing");
    assert.match(reviewed.resolutionNote, /Đang xác minh/);
    assert.ok(reviewed.reviewedBy.id);
    assert.equal(reviewed.resolvedAt, null);

    const resolveResponse = await request(
      `/api/admin/link-reports/${stored.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          status: "resolved",
          resolutionNote: "Đã xác minh và áp dụng biện pháp xử lý phù hợp.",
        }),
      },
    );
    assert.equal(resolveResponse.status, 200);
    assert.ok(
      ((await resolveResponse.json()) as { resolvedAt: string }).resolvedAt,
    );

    const deletePermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "link-reports.delete" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: deletePermission.id,
        },
      },
    });
    try {
      assert.equal(
        (
          await request(`/api/admin/link-reports/${stored.id}`, {
            method: "DELETE",
            headers: authorization,
          })
        ).status,
        403,
      );
    } finally {
      await prisma.roleHasPermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: deletePermission.id,
        },
      });
    }

    assert.equal(
      (
        await request(`/api/admin/link-reports/${stored.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/link-reports/${stored.id}`, {
          headers: authorization,
        })
      ).status,
      404,
    );
    assert.ok(
      (await prisma.linkReport.findUniqueOrThrow({ where: { id: stored.id } }))
        .deletedAt,
    );

    await prisma.linkReport.delete({ where: { id: stored.id } });
  });
});

