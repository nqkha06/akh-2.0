import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  request,
} from "../e2e-harness";

describe("Admin Media E2E", () => {
  it("isolates folders and files, supports bulk move, and blocks media in use", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };

    assert.equal((await request("/api/admin/media")).status, 401);

    const rootFolderResponse = await request("/api/admin/media/folders", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ name: "Brand assets", parentId: null }),
    });
    assert.equal(
      rootFolderResponse.status,
      201,
      await rootFolderResponse.clone().text(),
    );
    const rootFolder = (await rootFolderResponse.json()) as { id: string };

    const childFolderResponse = await request("/api/admin/media/folders", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ name: "Logos", parentId: rootFolder.id }),
    });
    assert.equal(childFolderResponse.status, 201);
    const childFolder = (await childFolderResponse.json()) as { id: string };

    const duplicateFolderResponse = await request(
      "/api/admin/media/folders",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({ name: " logos ", parentId: rootFolder.id }),
      },
    );
    assert.equal(duplicateFolderResponse.status, 409);
    assert.equal(
      ((await duplicateFolderResponse.json()) as { code: string }).code,
      "FOLDER_NAME_EXISTS",
    );

    const onePixelPng = Uint8Array.from(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    );
    const form = new FormData();
    form.append(
      "files",
      new Blob([onePixelPng], { type: "image/png" }),
      "logo-light.png",
    );
    form.append(
      "files",
      new Blob([onePixelPng], { type: "image/png" }),
      "logo-dark.png",
    );
    const uploadResponse = await request(
      `/api/admin/media/upload?folderId=${childFolder.id}`,
      {
        method: "POST",
        headers: authorization,
        body: form,
      },
    );
    assert.equal(uploadResponse.status, 201, await uploadResponse.clone().text());
    const uploaded = (await uploadResponse.json()) as {
      items: Array<{
        id: string;
        folderId: string;
        mimeType: string;
        width: number;
        height: number;
        url: string;
      }>;
    };
    assert.equal(uploaded.items.length, 2);
    assert.equal(uploaded.items[0]?.folderId, childFolder.id);
    assert.equal(uploaded.items[0]?.mimeType, "image/png");
    assert.equal(uploaded.items[0]?.width, 1);
    assert.equal(uploaded.items[0]?.height, 1);
    const mediaIds = uploaded.items.map((item) => item.id);

    const listResponse = await request(
      `/api/admin/media?folderId=${childFolder.id}&type=image%2Fpng&sortBy=fileName&sortOrder=asc`,
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200);
    assert.equal(
      ((await listResponse.json()) as { total: number }).total,
      2,
    );

    const contentResponse = await request(
      `/api/admin-media/public/${mediaIds[0]}/content`,
    );
    assert.equal(contentResponse.status, 200);
    assert.equal(contentResponse.headers.get("content-type"), "image/png");

    const updateResponse = await request(
      `/api/admin/media/${mediaIds[0]}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          fileName: "Primary logo.png",
          altText: "Primary brand logo",
          caption: "Used in the test page",
        }),
      },
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(
      ((await updateResponse.json()) as { altText: string }).altText,
      "Primary brand logo",
    );

    const blockedFolderDelete = await request(
      `/api/admin/media/folders/${rootFolder.id}`,
      { method: "DELETE", headers: authorization },
    );
    assert.equal(blockedFolderDelete.status, 409);
    assert.equal(
      ((await blockedFolderDelete.json()) as { code: string }).code,
      "FOLDER_NOT_EMPTY",
    );

    const bulkMoveResponse = await request("/api/admin/media/bulk-move", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ ids: mediaIds, folderId: null }),
    });
    assert.equal(bulkMoveResponse.status, 201);
    assert.equal(
      ((await bulkMoveResponse.json()) as { moved: number }).moved,
      2,
    );

    const pageResponse = await request("/api/admin/pages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        title: "Admin Media usage guard",
        slug: `admin-media-usage-${process.pid}`,
        contentJson: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
        contentHtml: "<p>Admin Media usage test.</p>",
        featuredImageId: mediaIds[0],
        status: "DRAFT",
        robotsIndex: true,
        robotsFollow: true,
        sortOrder: 0,
      }),
    });
    assert.equal(pageResponse.status, 201, await pageResponse.clone().text());
    const page = (await pageResponse.json()) as { id: number };

    const blockedMediaDelete = await request(
      `/api/admin/media/${mediaIds[0]}`,
      { method: "DELETE", headers: authorization },
    );
    assert.equal(blockedMediaDelete.status, 409);
    assert.equal(
      ((await blockedMediaDelete.json()) as { code: string }).code,
      "MEDIA_IN_USE",
    );

    assert.equal(
      (
        await request(`/api/admin/pages/${page.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );

    const bulkDeleteResponse = await request(
      "/api/admin/media/bulk-delete",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({ ids: mediaIds }),
      },
    );
    assert.equal(
      bulkDeleteResponse.status,
      201,
      await bulkDeleteResponse.clone().text(),
    );
    assert.equal(
      ((await bulkDeleteResponse.json()) as { deleted: number }).deleted,
      2,
    );

    assert.equal(
      (
        await request(`/api/admin/media/folders/${childFolder.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/media/folders/${rootFolder.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
  });
});

