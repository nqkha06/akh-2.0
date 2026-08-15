import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Member social links E2E", () => {
  it("generates random aliases independently from title and preserves custom aliases", async () => {
    const email = `link-alias-${process.pid}@example.com`;
    const password = "Secure123";
    const registerResponse = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Link Alias Test",
        email,
        password,
      }),
    });
    assert.equal(registerResponse.status, 201);

    const current = await loginAs(email, password);
    const authorization = {
      Authorization: `Bearer ${current.body.accessToken}`,
    };
    const createPayload = {
      title: "Tiêu đề không được dùng làm slug",
      inputType: "url",
      destinationUrl: "https://example.com/destination",
      actions: [
        {
          platform: "website",
          action: "visit",
          url: "https://example.com/action",
        },
      ],
    };

    const firstResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(createPayload),
    });
    const secondResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(createPayload),
    });

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 201);

    const first = (await firstResponse.json()) as { id: string; slug: string };
    const second = (await secondResponse.json()) as { id: string; slug: string };

    assert.match(first.slug, /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
    assert.match(second.slug, /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
    assert.notEqual(first.slug, second.slug);
    assert.notEqual(first.slug, "tieu-de-khong-duoc-dung-lam-slug");

    const untitledResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        inputType: createPayload.inputType,
        destinationUrl: createPayload.destinationUrl,
        actions: createPayload.actions,
      }),
    });
    assert.equal(untitledResponse.status, 201);
    const untitled = (await untitledResponse.json()) as {
      id: string;
      title: string;
    };
    assert.equal(untitled.title, "");

    const untitledUpdateResponse = await request(`/api/links/${untitled.id}`, {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({ ...createPayload, title: "   " }),
    });
    assert.equal(untitledUpdateResponse.status, 200);
    assert.equal(
      ((await untitledUpdateResponse.json()) as { title: string }).title,
      "",
    );

    const requestedAlias = `custom-alias-${process.pid}`;
    const customResponse = await request("/api/links", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        ...createPayload,
        customAlias: requestedAlias,
      }),
    });

    assert.equal(customResponse.status, 201);
    const custom = (await customResponse.json()) as {
      id: string;
      slug: string;
    };
    assert.equal(custom.slug, requestedAlias);

    await prisma.link.deleteMany({
      where: {
        id: {
          in: [
            Number(first.id),
            Number(second.id),
            Number(untitled.id),
            Number(custom.id),
          ],
        },
      },
    });
    await prisma.user.delete({ where: { email } });
  });
});

