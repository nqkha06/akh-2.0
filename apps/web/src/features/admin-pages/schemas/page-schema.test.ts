import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  emptyTiptapDocument,
  pageFormSchema,
  slugifyPageTitle,
} from "./page-schema.ts";

describe("Admin Pages form schema", () => {
  it("generates a normalized Vietnamese slug", () => {
    assert.equal(
      slugifyPageTitle("  Chính sách Đổi & Trả hàng!  "),
      "chinh-sach-doi-tra-hang",
    );
  });

  it("accepts a complete page form and rejects invalid slug/url", () => {
    const valid = pageFormSchema.safeParse({
      title: "Chính sách bảo mật",
      slug: "chinh-sach-bao-mat",
      excerpt: "",
      contentJson: emptyTiptapDocument,
      contentHtml: "<p>Nội dung</p>",
      featuredImageId: null,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "https://example.com/privacy",
      robotsIndex: true,
      robotsFollow: true,
      sortOrder: 0,
    });
    assert.equal(valid.success, true);

    const invalid = pageFormSchema.safeParse({
      ...valid.data,
      slug: "Slug Không Hợp Lệ",
      canonicalUrl: "not-a-url",
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.deepEqual(
        new Set(invalid.error.issues.map((issue) => issue.path[0])),
        new Set(["slug", "canonicalUrl"]),
      );
    }
  });
});
