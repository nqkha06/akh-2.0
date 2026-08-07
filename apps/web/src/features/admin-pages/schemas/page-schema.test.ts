import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  emptyTiptapDocument,
  pageFormSchema,
  slugifyPageTitle,
} from "./page-schema.ts";
import {
  canViewPublicPage,
  publicPagePath,
} from "../../pages/public-page-url.ts";

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

  it("builds public URLs only for valid published pages", () => {
    assert.equal(publicPagePath("chinh-sach-bao-mat"), "/chinh-sach-bao-mat");
    assert.equal(publicPagePath("  DIEU-KHOAN  "), "/dieu-khoan");
    assert.equal(publicPagePath("slug không hợp lệ"), null);
    assert.equal(
      canViewPublicPage({
        slug: "chinh-sach-bao-mat",
        status: "PUBLISHED",
      }),
      true,
    );
    assert.equal(
      canViewPublicPage({ slug: "chinh-sach-bao-mat", status: "DRAFT" }),
      false,
    );
    assert.equal(
      canViewPublicPage({ slug: "chinh-sach-bao-mat", status: "ARCHIVED" }),
      false,
    );
  });
});
