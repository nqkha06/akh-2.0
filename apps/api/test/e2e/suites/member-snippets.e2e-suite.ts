import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  login,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Member snippets E2E", () => {
  it("isolates owners, soft deletes library rows and preserves link snapshots", async () => {
    const owner = await login();
    const secondEmail = `snippet-owner-${process.pid}@example.com`;
    const registerSecond = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Second Snippet Owner",
        email: secondEmail,
        password: "Secure123",
      }),
    });
    assert.equal(registerSecond.status, 201);
    const second = await loginAs(secondEmail, "Secure123");
    const ownerAuthorization = {
      Authorization: `Bearer ${owner.body.accessToken}`,
    };
    const secondAuthorization = {
      Authorization: `Bearer ${second.body.accessToken}`,
    };

    assert.equal((await request("/api/member/snippets")).status, 401);

    const createSnippetResponse = await request("/api/member/snippets", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        name: "Private launch code",
        content: "ORIGINAL-SNAPSHOT",
      }),
    });
    assert.equal(createSnippetResponse.status, 201);
    const snippet = (await createSnippetResponse.json()) as {
      id: string;
      name: string;
      content: string;
    };

    const listResponse = await request(
      "/api/member/snippets?page=1&limit=10&search=launch&sortBy=name&sortOrder=asc",
      { headers: ownerAuthorization },
    );
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()) as {
      items: Array<Record<string, unknown>>;
      pagination: { totalItems: number; totalPages: number };
    };
    assert.equal(list.pagination.totalItems, 1);
    assert.equal(list.pagination.totalPages, 1);
    assert.equal(list.items[0]?.id, snippet.id);
    assert.equal("copies" in list.items[0], false);

    assert.equal(
      (
        await request(`/api/member/snippets/${snippet.id}`, {
          headers: secondAuthorization,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(`/api/member/snippets/${snippet.id}`, {
          method: "PATCH",
          headers: secondAuthorization,
          body: JSON.stringify({ content: "STOLEN" }),
        })
      ).status,
      404,
    );

    const crossOwnerLink = await request("/api/links", {
      method: "POST",
      headers: secondAuthorization,
      body: JSON.stringify({
        title: "Cross-owner snippet",
        inputType: "snippet",
        selectedSnippet: snippet.id,
        actions: [
          {
            platform: "website",
            action: "visit",
            url: "https://example.com/action",
          },
        ],
      }),
    });
    assert.equal(crossOwnerLink.status, 400);

    const alias = `snippet-snapshot-${process.pid}`;
    const createLinkResponse = await request("/api/links", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        title: "Snapshot link",
        inputType: "snippet",
        selectedSnippet: snippet.id,
        customAlias: alias,
        actions: [
          {
            platform: "website",
            action: "visit",
            url: "https://example.com/action",
          },
        ],
      }),
    });
    assert.equal(createLinkResponse.status, 201);
    assert.equal(
      ((await createLinkResponse.json()) as { destinationUrl: string })
        .destinationUrl,
      "ORIGINAL-SNAPSHOT",
    );

    const updateSnippetResponse = await request(
      `/api/member/snippets/${snippet.id}`,
      {
        method: "PATCH",
        headers: ownerAuthorization,
        body: JSON.stringify({ content: "UPDATED-LIBRARY-CONTENT" }),
      },
    );
    assert.equal(updateSnippetResponse.status, 200);

    const beforeDeleteLink = await request(`/api/links/${alias}`);
    assert.equal(beforeDeleteLink.status, 200);
    assert.equal(
      ((await beforeDeleteLink.json()) as { destinationUrl: string })
        .destinationUrl,
      "ORIGINAL-SNAPSHOT",
    );

    const deleteSnippetResponse = await request(
      `/api/member/snippets/${snippet.id}`,
      { method: "DELETE", headers: ownerAuthorization },
    );
    assert.equal(deleteSnippetResponse.status, 200);
    assert.equal(
      (
        await request(`/api/member/snippets/${snippet.id}`, {
          headers: ownerAuthorization,
        })
      ).status,
      404,
    );

    const deletedRecord = await prisma.snippet.findUniqueOrThrow({
      where: { id: Number(snippet.id) },
    });
    assert.ok(deletedRecord.deletedAt);

    const afterDeleteLink = await request(`/api/links/${alias}`);
    assert.equal(afterDeleteLink.status, 200);
    assert.equal(
      ((await afterDeleteLink.json()) as { destinationUrl: string })
        .destinationUrl,
      "ORIGINAL-SNAPSHOT",
    );

    await prisma.link.delete({ where: { slug: alias } });
    await prisma.snippet.delete({ where: { id: Number(snippet.id) } });
    await prisma.user.delete({ where: { email: secondEmail } });
  });
});

