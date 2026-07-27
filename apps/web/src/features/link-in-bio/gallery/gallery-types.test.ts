import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bioPageToPayload } from "../components/types.ts";
import {
  createGalleryBlock,
  getGalleryLayoutModel,
  normalizeContentOrder,
  normalizeGalleryImages,
} from "./gallery-types.ts";

describe("Link-in-bio gallery mapping", () => {
  it("keeps gallery config and content order when cloning a bio page", () => {
    const gallery = createGalleryBlock("gallery-1");
    gallery.images = [{
      id: "image-1",
      fileId: "42",
      url: "/api/backend/member/files/42/preview",
      alt: "Ảnh dự án",
      sortOrder: 0,
    }];
    const payload = bioPageToPayload({
      id: "bio-1",
      slug: "creator",
      publicUrl: "/b/creator",
      name: "Creator",
      title: null,
      status: "published",
      views: 0,
      clicks: 0,
      socialLinks: [],
      customLinks: [],
      widgets: [],
      galleries: [gallery],
      dividers: [],
      bankDetails: [],
      contentOrder: [{ type: "gallery", id: "gallery-1" }],
      hiddenLinks: [],
      appearance: { buttonStyle: "rounded", backgroundColor: "#ffffff" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    });
    assert.deepEqual(payload.galleries, [gallery]);
    assert.deepEqual(payload.contentOrder, [{ type: "gallery", id: "gallery-1" }]);
  });

  it("normalizes old or incomplete content order without losing blocks", () => {
    const result = normalizeContentOrder(
      [{ type: "link", id: "link-1" }, { type: "link", id: "missing" }],
      { widgets: [{ id: "widget-1" }], galleries: [{ id: "gallery-1" }], links: [{ id: "link-1" }] },
    );
    assert.deepEqual(result, [
      { type: "link", id: "link-1" },
      { type: "widget", id: "widget-1" },
      { type: "gallery", id: "gallery-1" },
    ]);
  });

  it("adapts legacy social data into the shared content order", () => {
    const result = normalizeContentOrder(
      [{ type: "link", id: "link-1" }],
      { socials: [{ id: "social-1" }], widgets: [], galleries: [], links: [{ id: "link-1" }] },
    );
    assert.deepEqual(result, [
      { type: "link", id: "link-1" },
      { type: "social", id: "socials" },
    ]);
  });

  it("keeps divider and bank details in the shared content order", () => {
    const result = normalizeContentOrder(
      [{ type: "bank-details", id: "bank-1" }],
      {
        widgets: [],
        galleries: [],
        dividers: [{ id: "divider-1" }],
        bankDetails: [{ id: "bank-1" }],
        links: [],
      },
    );
    assert.deepEqual(result, [
      { type: "bank-details", id: "bank-1" },
      { type: "divider", id: "divider-1" },
    ]);
  });

  it("produces stable responsive classes used by the shared renderer", () => {
    const gallery = createGalleryBlock("gallery-1");
    gallery.columns = { mobile: 2, tablet: 4, desktop: 6 };
    gallery.aspectRatio = "16:9";
    gallery.gap = "sm";
    const layout = getGalleryLayoutModel(gallery);
    assert.match(layout.gridColumnsClass, /grid-cols-2/);
    assert.match(layout.gridColumnsClass, /sm:grid-cols-4/);
    assert.match(layout.gridColumnsClass, /lg:grid-cols-6/);
    assert.equal(layout.aspectClass, "aspect-video");
    assert.equal(layout.gapClass, "gap-1.5");
  });

  it("reassigns contiguous sort order after image drag and drop", () => {
    const images = normalizeGalleryImages([
      { id: "b", fileId: "2", url: "/2", sortOrder: 9 },
      { id: "a", fileId: "1", url: "/1", sortOrder: 4 },
    ]);
    assert.deepEqual(images.map((image) => image.sortOrder), [0, 1]);
  });
});
