import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  prisma,
  request,
} from "../e2e-harness";

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

    assert.equal((await request("/api/admin/social-links")).status, 401);

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
      totalViews: number;
    };
    assert.equal(list.total, 1);
    assert.equal(list.items[0]?.id, link.id);
    assert.equal(list.items[0]?.owner.email, "auth@example.com");
    assert.equal(list.items[0]?.actionsCount, 1);
    assert.equal(list.totalViews, 0);

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
    assert.equal(((await deletedList.json()) as { total: number }).total, 1);

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

