import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  request,
} from "../e2e-harness";

describe("Website menus E2E", () => {
  it("publishes localized snapshots, protects versions and manages locations", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/menus")).status, 401);

    const createResponse = await request("/api/admin/menus", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        key: `e2e-menu-${process.pid}`,
        name: "Menu E2E",
        description: "Menu dùng cho kiểm thử.",
        translations: [{ locale: "vi", title: "Điều hướng E2E" }],
      }),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      draftVersion: number;
    };
    assert.equal(created.draftVersion, 1);

    const unsafeTree = await request(
      `/api/admin/menus/${created.id}/tree`,
      {
        method: "PUT",
        headers: authorization,
        body: JSON.stringify({
          expectedVersion: 1,
          items: [
            {
              type: "CUSTOM_URL",
              url: "javascript:alert(1)",
              target: "SELF",
              isEnabled: true,
              translations: [{ locale: "vi", label: "Không an toàn" }],
              children: [],
            },
          ],
        }),
      },
    );
    assert.equal(unsafeTree.status, 400);

    const treeResponse = await request(
      `/api/admin/menus/${created.id}/tree`,
      {
        method: "PUT",
        headers: authorization,
        body: JSON.stringify({
          expectedVersion: 1,
          items: [
            {
              type: "CUSTOM_URL",
              url: "/e2e",
              target: "BLANK",
              isEnabled: true,
              translations: [{ locale: "vi", label: "Kiểm thử" }],
              children: [],
            },
          ],
        }),
      },
    );
    assert.equal(treeResponse.status, 200, await treeResponse.clone().text());
    assert.equal(
      ((await treeResponse.json()) as { draftVersion: number }).draftVersion,
      2,
    );

    const staleResponse = await request(
      `/api/admin/menus/${created.id}/tree`,
      {
        method: "PUT",
        headers: authorization,
        body: JSON.stringify({ expectedVersion: 1, items: [] }),
      },
    );
    assert.equal(staleResponse.status, 409);
    assert.equal(
      ((await staleResponse.json()) as { code: string }).code,
      "MENU_VERSION_CONFLICT",
    );

    const publishResponse = await request(
      `/api/admin/menus/${created.id}/publish`,
      { method: "POST", headers: authorization },
    );
    assert.equal(publishResponse.status, 201);

    const assignmentResponse = await request("/api/admin/menus/locations", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        location: "header-primary",
        menuId: created.id,
      }),
    });
    assert.equal(assignmentResponse.status, 200);

    const socialAssignmentResponse = await request("/api/admin/menus/locations", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        location: "footer-social",
        menuId: created.id,
      }),
    });
    assert.equal(socialAssignmentResponse.status, 200);

    const publicResponse = await request(
      "/api/website/menus?locations=header-primary&locale=en",
    );
    assert.equal(publicResponse.status, 200);
    const publicBody = (await publicResponse.json()) as {
      menus: {
        "header-primary": {
          items: Array<{ label: string; rel: string; target: string }>;
        };
      };
    };
    assert.equal(publicBody.menus["header-primary"].items[0]?.label, "Kiểm thử");
    assert.equal(publicBody.menus["header-primary"].items[0]?.target, "_blank");
    assert.equal(
      publicBody.menus["header-primary"].items[0]?.rel,
      "noopener noreferrer",
    );

    const inUseDelete = await request(`/api/admin/menus/${created.id}`, {
      method: "DELETE",
      headers: authorization,
    });
    assert.equal(inUseDelete.status, 409);
    assert.equal(
      ((await inUseDelete.json()) as { code: string }).code,
      "MENU_IN_USE",
    );

    assert.equal(
      (
        await request("/api/admin/menus/locations/header-primary", {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/api/admin/menus/locations/footer-social", {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/menus/${created.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
  });
});
