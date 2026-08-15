import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import {
  adminAccessToken,
  app,
  prisma,
  request,
} from "../e2e-harness";
import {
  PAGE_DETAIL_RESPONSE_KEYS,
  PAGE_LIST_ITEM_RESPONSE_KEYS,
  PAGE_LIST_RESPONSE_KEYS,
  PAGES_OPENAPI_ROUTE_SNAPSHOT,
  PUBLIC_PAGE_RESPONSE_KEYS,
} from "../../contracts/pages-api.contract";

describe("Admin pages CRUD E2E", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Nội dung kiểm thử Pages." }],
      },
    ],
  };

  it("preserves the Pages OpenAPI route snapshot", () => {
    const openApi = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("Pages contract").build(),
      { deepScanRoutes: true },
    );
    const httpMethods = new Set([
      "delete",
      "get",
      "head",
      "options",
      "patch",
      "post",
      "put",
      "trace",
    ]);
    const pageRoutes = Object.fromEntries(
      Object.entries(openApi.paths)
        .filter(([path]) => path.includes("/pages"))
        .map(([path, definition]) => [
          path,
          Object.keys(definition ?? {})
            .filter((key) => httpMethods.has(key))
            .sort(),
        ]),
    );

    assert.deepEqual(pageRoutes, PAGES_OPENAPI_ROUTE_SNAPSHOT);
  });

  it("supports validated CRUD, tablecn queries, lifecycle, sanitization and soft delete", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/pages")).status, 401);

    const createResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Chính sách Bảo mật",
        contentJson: document,
        contentHtml:
          '<h1 onclick="alert(1)">An toàn</h1><script>alert(1)</script><a href="javascript:alert(1)">Link</a>',
        excerpt: "Trang kiểm thử.",
        status: "DRAFT",
        robotsIndex: true,
        robotsFollow: true,
        sortOrder: 10,
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      slug: string;
      status: string;
      contentJson: { type: string };
      contentHtml: string;
      publishedAt: string | null;
    };
    assert.equal(created.slug, "chinh-sach-bao-mat");
    assert.equal(created.status, "DRAFT");
    assert.equal(created.contentJson.type, "doc");
    assert.equal(created.publishedAt, null);
    assert.equal(created.contentHtml.includes("<script"), false);
    assert.equal(created.contentHtml.includes("onclick"), false);
    assert.equal(created.contentHtml.includes("javascript:"), false);
    assert.deepEqual(Object.keys(created).sort(), PAGE_DETAIL_RESPONSE_KEYS);
    assert.equal(
      (
        await request(`/api/public/pages/${created.slug}`)
      ).status,
      404,
    );
    assert.equal(
      (await request("/api/public/pages/slug%20khong%20hop%20le")).status,
      404,
    );

    const duplicateResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Trùng slug",
        slug: "CHINH SACH BAO MAT",
        contentJson: document,
        contentHtml: "<p>Duplicate</p>",
      }),
    });
    assert.equal(duplicateResponse.status, 409);

    const secondResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Điều khoản sử dụng",
        slug: "dieu-khoan-su-dung",
        contentJson: document,
        contentHtml: "<p>Điều khoản.</p>",
        status: "DRAFT",
        sortOrder: 20,
      }),
    });
    assert.equal(secondResponse.status, 201);
    const second = (await secondResponse.json()) as { id: number };

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: "admin" },
    });
    const updatePermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "pages.update" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: updatePermission.id,
        },
      },
    });
    const deniedUpdate = await request(`/api/admin/pages/${created.id}`, {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({ title: "Không được cập nhật" }),
    });
    assert.equal(deniedUpdate.status, 403);
    await prisma.roleHasPermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: updatePermission.id,
      },
    });

    assert.equal(
      (
        await request("/api/admin/pages/bulk/status", {
          method: "PATCH",
          headers: authorization,
          body: JSON.stringify({ ids: [], status: "DRAFT" }),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/api/admin/pages/bulk/status", {
          method: "PATCH",
          headers: authorization,
          body: JSON.stringify({ ids: [987654321], status: "DRAFT" }),
        })
      ).status,
      404,
    );

    const tableQuery = new URLSearchParams({
      page: "1",
      perPage: "1",
      search: "chinh-sach",
      sort: JSON.stringify([{ id: "title", desc: false }]),
      filters: JSON.stringify([
        {
          id: "status",
          value: ["DRAFT"],
          variant: "multiSelect",
          operator: "inArray",
          filterId: "page-status-filter",
        },
        {
          id: "title",
          value: "Chính sách",
          variant: "text",
          operator: "iLike",
          filterId: "page-title-filter",
        },
      ]),
      joinOperator: "and",
    });
    const listResponse = await request(`/api/admin/pages?${tableQuery}`, {
      headers: authorization,
    });
    assert.equal(listResponse.status, 200, await listResponse.clone().text());
    const list = (await listResponse.json()) as {
      items: Array<{ id: number; contentHtml?: string }>;
      total: number;
      pageCount: number;
      perPage: number;
    };
    assert.equal(list.total, 1);
    assert.equal(list.pageCount, 1);
    assert.equal(list.perPage, 1);
    assert.equal(list.items[0]?.id, created.id);
    assert.equal("contentHtml" in list.items[0]!, false);
    assert.deepEqual(Object.keys(list).sort(), PAGE_LIST_RESPONSE_KEYS);
    assert.deepEqual(
      Object.keys(list.items[0]!).sort(),
      PAGE_LIST_ITEM_RESPONSE_KEYS,
    );

    const invalidQuery = new URLSearchParams({
      sort: JSON.stringify([{ id: "contentHtml", desc: true }]),
      filters: JSON.stringify([
        {
          id: "deletedAt",
          value: "x",
          variant: "text",
          operator: "iLike",
          filterId: "private-field",
        },
      ]),
    });
    assert.equal(
      (
        await request(`/api/admin/pages?${invalidQuery}`, {
          headers: authorization,
        })
      ).status,
      400,
    );

    const updateResponse = await request(
      `/api/admin/pages/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          title: "Chính sách quyền riêng tư",
          slug: "quyen-rieng-tu",
          contentJson: document,
          contentHtml: "<p>Nội dung đã cập nhật.</p>",
          seoTitle: "SEO privacy",
          canonicalUrl: "https://example.com/quyen-rieng-tu",
        }),
      },
    );
    assert.equal(updateResponse.status, 200);
    const updated = (await updateResponse.json()) as {
      slug: string;
      seoTitle: string;
    };
    assert.equal(updated.slug, "quyen-rieng-tu");
    assert.equal(updated.seoTitle, "SEO privacy");

    const publishResponse = await request(
      `/api/admin/pages/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "PUBLISHED" }),
      },
    );
    assert.equal(publishResponse.status, 200);
    const published = (await publishResponse.json()) as {
      status: string;
      publishedAt: string;
    };
    assert.equal(published.status, "PUBLISHED");
    assert.ok(published.publishedAt);

    const publicResponse = await request(
      "/api/public/pages/quyen-rieng-tu",
    );
    assert.equal(publicResponse.status, 200);
    const publicPage = (await publicResponse.json()) as Record<
      string,
      unknown
    >;
    assert.equal(publicPage.title, "Chính sách quyền riêng tư");
    assert.equal(publicPage.slug, "quyen-rieng-tu");
    assert.equal(publicPage.contentHtml, "<p>Nội dung đã cập nhật.</p>");
    assert.equal(publicPage.seoTitle, "SEO privacy");
    assert.equal("id" in publicPage, false);
    assert.equal("status" in publicPage, false);
    assert.equal("contentJson" in publicPage, false);
    assert.equal("deletedAt" in publicPage, false);
    assert.deepEqual(Object.keys(publicPage).sort(), PUBLIC_PAGE_RESPONSE_KEYS);

    const draftResponse = await request(
      `/api/admin/pages/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "DRAFT" }),
      },
    );
    assert.equal(draftResponse.status, 200);
    const drafted = (await draftResponse.json()) as {
      status: string;
      publishedAt: string;
      contentHtml: string;
    };
    assert.equal(drafted.status, "DRAFT");
    assert.equal(drafted.publishedAt, published.publishedAt);
    assert.equal(drafted.contentHtml, "<p>Nội dung đã cập nhật.</p>");
    assert.equal(
      (await request("/api/public/pages/quyen-rieng-tu")).status,
      404,
    );

    const publishPermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "pages.publish" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: publishPermission.id,
        },
      },
    });
    const deniedPublish = await request(
      `/api/admin/pages/${created.id}/status`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({ status: "PUBLISHED" }),
      },
    );
    assert.equal(deniedPublish.status, 403);
    await prisma.roleHasPermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: publishPermission.id,
      },
    });

    const bulkArchive = await request("/api/admin/pages/bulk/status", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        ids: [created.id, second.id, second.id],
        status: "ARCHIVED",
      }),
    });
    assert.equal(bulkArchive.status, 200);
    assert.deepEqual(await bulkArchive.json(), { updated: 2 });
    assert.equal(
      (await request("/api/public/pages/quyen-rieng-tu")).status,
      404,
    );

    const restored = await request("/api/admin/pages/bulk/status", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        ids: [created.id, second.id],
        status: "DRAFT",
      }),
    });
    assert.equal(restored.status, 200);
    assert.deepEqual(await restored.json(), { updated: 2 });

    const deletePermission = await prisma.permission.findUniqueOrThrow({
      where: { key: "pages.delete" },
    });
    await prisma.roleHasPermission.delete({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: deletePermission.id,
        },
      },
    });
    const deniedDelete = await request("/api/admin/pages/bulk", {
      method: "DELETE",
      headers: authorization,
      body: JSON.stringify({ ids: [created.id] }),
    });
    assert.equal(deniedDelete.status, 403);
    await prisma.roleHasPermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: deletePermission.id,
      },
    });

    const deleteResponse = await request("/api/admin/pages/bulk", {
      method: "DELETE",
      headers: authorization,
      body: JSON.stringify({ ids: [created.id, second.id] }),
    });
    assert.equal(deleteResponse.status, 200);
    assert.deepEqual(await deleteResponse.json(), { deleted: 2 });
    assert.equal(
      (await request("/api/public/pages/quyen-rieng-tu")).status,
      404,
    );
    assert.equal(
      (
        await request(`/api/admin/pages/${created.id}`, {
          headers: authorization,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request("/api/admin/pages?search=quyen-rieng-tu", {
          headers: authorization,
        })
      ).status,
      200,
    );
    const deletedList = await request(
      "/api/admin/pages?search=quyen-rieng-tu",
      { headers: authorization },
    );
    assert.equal(
      ((await deletedList.json()) as { total: number }).total,
      0,
    );
    assert.equal(
      (
        await request("/api/admin/pages/987654321", {
          headers: authorization,
        })
      ).status,
      404,
    );

    await prisma.page.deleteMany({
      where: { id: { in: [created.id, second.id] } },
    });
  });
});
