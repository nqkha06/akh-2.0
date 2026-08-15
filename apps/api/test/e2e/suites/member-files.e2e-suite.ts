import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  login,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Member files E2E", () => {
  it("isolates owners, reserves quota and blocks deletion while in use", async () => {
    const owner = await login();
    const secondEmail = `file-owner-${process.pid}@example.com`;
    assert.equal((await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Second File Owner", email: secondEmail, password: "Secure123" }),
    })).status, 201);
    const second = await loginAs(secondEmail, "Secure123");
    const ownerAuthorization = { Authorization: `Bearer ${owner.body.accessToken}` };
    const secondAuthorization = { Authorization: `Bearer ${second.body.accessToken}` };

    assert.equal((await request("/api/member/files")).status, 401);

    const initiate = await request("/api/member/files/multipart", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({ fileName: "private.txt", mimeType: "text/plain", size: 4, purpose: "file" }),
    });
    assert.equal(initiate.status, 201);
    const upload = (await initiate.json()) as { uploadId: string; totalParts: number };
    assert.equal(upload.totalParts, 1);
    const ownerId = Number(owner.body.user.id);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })).storageReservedBytes, 4n);

    const form = new FormData();
    form.append("chunk", new Blob(["test"], { type: "text/plain" }), "part-1");
    assert.equal((await request(`/api/member/files/multipart/${upload.uploadId}/parts/1`, {
      method: "POST", headers: ownerAuthorization, body: form,
    })).status, 201);
    const complete = await request(`/api/member/files/multipart/${upload.uploadId}/complete`, {
      method: "POST", headers: ownerAuthorization,
    });
    assert.equal(complete.status, 201);
    const file = (await complete.json()) as { id: string; usageCount: number };
    assert.equal("isPublic" in file, false);
    assert.equal(file.usageCount, 0);
    assert.equal(
      (await request(`/api/member/files/${file.id}/download`, {
        headers: ownerAuthorization,
      })).status,
      404,
    );
    assert.equal(
      (await request(`/api/files/public/${file.id}/download`)).status,
      404,
    );

    const counters = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    assert.equal(counters.storageReservedBytes, 0n);
    assert.equal(counters.storageUsedBytes, 4n);

    const ownerList = await request("/api/member/files?page=1&limit=10&type=document", { headers: ownerAuthorization });
    assert.equal(ownerList.status, 200);
    const ownerFiles = (await ownerList.json()) as {
      items: Array<{ id: string }>;
      pagination: { totalItems: number };
      summary: { usedBytes: number; limitBytes: number };
    };
    assert.equal(ownerFiles.pagination.totalItems, 1);
    assert.equal(ownerFiles.items[0]?.id, file.id);
    assert.equal(ownerFiles.summary.usedBytes, 4);
    assert.equal(ownerFiles.summary.limitBytes, 1024 * 1024);

    const secondList = await request("/api/member/files", { headers: secondAuthorization });
    assert.equal(secondList.status, 200);
    assert.equal(((await secondList.json()) as { pagination: { totalItems: number } }).pagination.totalItems, 0);
    assert.equal((await request(`/api/member/files/${file.id}`, {
      method: "PATCH", headers: secondAuthorization, body: JSON.stringify({ name: "stolen" }),
    })).status, 404);

    const crossOwnerLink = await request("/api/links", {
      method: "POST",
      headers: secondAuthorization,
      body: JSON.stringify({
        title: "Cross-owner file", inputType: "file", selectedFile: file.id,
        actions: [{ platform: "website", action: "visit", url: "https://example.com/action" }],
      }),
    });
    assert.equal(crossOwnerLink.status, 400);

    const alias = `member-file-${process.pid}`;
    const createFileLink = await request("/api/links", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        title: "Owned file", inputType: "file", selectedFile: file.id, customAlias: alias,
        actions: [{ platform: "website", action: "visit", url: "https://example.com/action" }],
      }),
    });
    assert.equal(createFileLink.status, 201);
    const createdFileLink = (await createFileLink.json()) as {
      destinationUrl: string;
      destinationFileName: string | null;
    };
    assert.equal(createdFileLink.destinationUrl, `/api/public/files/${alias}`);
    assert.equal(createdFileLink.destinationFileName, "private.txt");

    const socialLinkDownload = await request(`/api/files/link/${alias}/download`);
    assert.equal(socialLinkDownload.status, 200);
    assert.match(
      socialLinkDownload.headers.get("content-disposition") || "",
      /^attachment;/,
    );
    assert.equal(await socialLinkDownload.text(), "test");

    const inUseDelete = await request(`/api/member/files/${file.id}`, { method: "DELETE", headers: ownerAuthorization });
    assert.equal(inUseDelete.status, 409);
    assert.equal(((await inUseDelete.json()) as { code: string }).code, "FILE_IN_USE");

    const link = await prisma.link.findUniqueOrThrow({ where: { slug: alias } });
    assert.equal((await request(`/api/links/${link.id}`, { method: "DELETE", headers: ownerAuthorization })).status, 200);
    assert.equal((await request(`/api/member/files/${file.id}`, { method: "DELETE", headers: ownerAuthorization })).status, 200);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })).storageUsedBytes, 4n);
  });
});

