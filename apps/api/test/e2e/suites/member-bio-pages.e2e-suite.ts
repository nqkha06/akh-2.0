import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Member Bio Pages E2E", () => {
  it("isolates owners, stores a JSON document and exposes only published pages", async () => {
    const ownerEmail = "bio-owner@example.com";
    const otherEmail = "bio-other@example.com";
    for (const [name, email] of [
      ["Bio Owner", ownerEmail],
      ["Bio Other", otherEmail],
    ]) {
      assert.equal(
        (
          await request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password: "Secure123" }),
          })
        ).status,
        201,
      );
    }

    const owner = await loginAs(ownerEmail, "Secure123");
    const other = await loginAs(otherEmail, "Secure123");
    const ownerAuthorization = {
      Authorization: `Bearer ${owner.body.accessToken}`,
    };
    const otherAuthorization = {
      Authorization: `Bearer ${other.body.accessToken}`,
    };
    const galleryPng = Uint8Array.from(Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ));
    const initiateGalleryUpload = await request("/api/member/files/multipart", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({ fileName: "gallery.png", mimeType: "image/png", size: galleryPng.length, purpose: "cover" }),
    });
    assert.equal(initiateGalleryUpload.status, 201);
    const galleryUpload = (await initiateGalleryUpload.json()) as { uploadId: string };
    const galleryForm = new FormData();
    galleryForm.append("chunk", new Blob([galleryPng], { type: "image/png" }), "part-1");
    assert.equal((await request(`/api/member/files/multipart/${galleryUpload.uploadId}/parts/1`, {
      method: "POST", headers: ownerAuthorization, body: galleryForm,
    })).status, 201);
    const galleryComplete = await request(`/api/member/files/multipart/${galleryUpload.uploadId}/complete`, {
      method: "POST", headers: ownerAuthorization,
    });
    assert.equal(galleryComplete.status, 201);
    const galleryFile = (await galleryComplete.json()) as { id: string };
    const draftPayload = {
      name: "Creator Bio",
      title: "Creator",
      customSlug: "creator-bio-test",
      status: "draft",
      socialLinks: [
        {
          id: "social-1",
          platform: "Instagram",
          url: "https://instagram.com/example",
        },
      ],
      customLinks: [
        {
          id: "link-1",
          title: "Portfolio",
          url: "https://example.com/portfolio",
          animationEffect: "bounce",
        },
      ],
      widgets: [],
      galleries: [{
        id: "gallery-1",
        type: "gallery",
        title: "Projects",
        enabled: true,
        showTitle: true,
        displayMode: "grid",
        aspectRatio: "1:1",
        columns: { mobile: 2, tablet: 3, desktop: 3 },
        gap: "md",
        radius: "md",
        showCaption: true,
        border: "none",
        shadow: "none",
        images: [{ id: "gallery-image-1", fileId: galleryFile.id, url: "/private", alt: "Project", sortOrder: 0 }],
      }],
      dividers: [{
        id: "divider-1",
        type: "divider",
        enabled: true,
        label: "Support",
        showLabel: true,
        style: "solid",
        spacing: "md",
      }],
      bankDetails: [{
        id: "bank-1",
        type: "bank-details",
        enabled: true,
        title: "Bank transfer",
        bankName: "Test Bank",
        accountName: "TEST USER",
        accountNumber: "123456789",
        branch: "Test branch",
        note: "Test transfer only",
        showCopyButton: true,
      }],
      contentOrder: [
        { type: "gallery", id: "gallery-1" },
        { type: "divider", id: "divider-1" },
        { type: "bank-details", id: "bank-1" },
        { type: "link", id: "link-1" },
      ],
      hiddenLinks: ["link-1"],
      appearance: {
        buttonStyle: "rounded",
        backgroundColor: "#ffffff",
        avatarFileId: galleryFile.id,
        backgroundFileId: galleryFile.id,
        backgroundMediaType: "image",
      },
    };

    assert.equal(
      (
        await request("/api/member/bio-pages", {
          method: "POST",
          body: JSON.stringify(draftPayload),
        })
      ).status,
      401,
    );

    const createdResponse = await request("/api/member/bio-pages", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify(draftPayload),
    });
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()) as {
      id: string;
      slug: string;
      hiddenLinks: string[];
    };
    assert.deepEqual(created.hiddenLinks, ["link-1"]);

    const stored = await prisma.bioPage.findUniqueOrThrow({
      where: { id: created.id },
    });
    assert.equal(stored.userId, owner.body.user.id);
    assert.equal(
      (
        JSON.parse(stored.contentJson) as {
          customLinks: Array<{ id: string; isVisible: boolean }>;
        }
      ).customLinks[0].isVisible,
      false,
    );
    assert.equal(JSON.parse(stored.appearanceJson).buttonStyle, "rounded");

    const otherList = await request("/api/member/bio-pages", {
      headers: otherAuthorization,
    });
    assert.equal(otherList.status, 200);
    assert.deepEqual(await otherList.json(), []);
    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "PATCH",
          headers: otherAuthorization,
          body: JSON.stringify({ ...draftPayload, status: "published" }),
        })
      ).status,
      404,
    );
    assert.equal(
      (await request(`/api/public/bio-pages/${created.slug}`)).status,
      404,
    );

    const invalidPublishedBank = {
      ...draftPayload,
      status: "published",
      bankDetails: draftPayload.bankDetails.map((block) => ({
        ...block,
        accountNumber: "",
      })),
    };
    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "PATCH",
          headers: ownerAuthorization,
          body: JSON.stringify(invalidPublishedBank),
        })
      ).status,
      400,
    );

    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "PATCH",
          headers: ownerAuthorization,
          body: JSON.stringify({ ...draftPayload, status: "published" }),
        })
      ).status,
      200,
    );
    const publicBioResponse = await request(`/api/public/bio-pages/${created.slug}`);
    assert.equal(publicBioResponse.status, 200);
    const publicBio = (await publicBioResponse.json()) as {
      appearance: { avatarUrl?: string; backgroundMediaUrl?: string };
      galleries: Array<{ images: Array<{ url: string }> }>;
      dividers: Array<{ id: string }>;
      bankDetails: Array<{ accountNumber: string }>;
      customLinks: Array<{ animationEffect: string }>;
      contentOrder: Array<{ type: string; id: string }>;
    };
    const publicMediaUrl = `/api/public/bio-pages/${created.slug}/media/${galleryFile.id}`;
    assert.equal(publicBio.appearance.avatarUrl, publicMediaUrl);
    assert.equal(publicBio.appearance.backgroundMediaUrl, publicMediaUrl);
    assert.equal(publicBio.galleries[0].images[0].url, `/api/public/bio-pages/${created.slug}/media/${galleryFile.id}`);
    assert.equal(publicBio.dividers[0].id, "divider-1");
    assert.equal(publicBio.bankDetails[0].accountNumber, "123456789");
    assert.equal(publicBio.customLinks[0].animationEffect, "bounce");
    assert.deepEqual(publicBio.contentOrder.map(({ type }) => type), ["gallery", "divider", "bank-details", "link", "social"]);
    const publicGalleryImage = await request(`/api/public/bio-pages/${created.slug}/media/${galleryFile.id}`);
    assert.equal(publicGalleryImage.status, 200);
    assert.equal(publicGalleryImage.headers.get("content-type"), "image/png");

    assert.equal(
      (
        await request(`/api/member/bio-pages/${created.id}`, {
          method: "DELETE",
          headers: ownerAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (await request(`/api/public/bio-pages/${created.slug}`)).status,
      404,
    );
  });
});

