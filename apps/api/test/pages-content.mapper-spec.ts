/// <reference types="node" />

import { BadRequestException } from "@nestjs/common";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  localizedPageSlugCandidates,
  normalizePageSlug,
  sanitizePageContent,
  serializePageContent,
} from "../src/modules/pages/pages-content";
import {
  mapPageDetail,
  mapPageListItem,
  mapPublicPage,
} from "../src/modules/pages/pages.mapper";
import type {
  PageRecord,
  PublicPageRecord,
} from "../src/modules/pages/pages.select";

const createdAt = new Date("2026-08-08T00:00:00.000Z");

function pageRecord(contentJson: string): PageRecord {
  return {
    id: 1,
    title: "Privacy",
    slug: "privacy",
    excerpt: null,
    contentJson,
    contentHtml: "<p>Safe</p>",
    status: "DRAFT",
    featuredImageId: null,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    canonicalUrl: null,
    robotsIndex: true,
    robotsFollow: true,
    sortOrder: 0,
    publishedAt: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    featuredImage: null,
  };
}

describe("Pages content and mapper", () => {
  it("normalizes Vietnamese slugs and rejects empty slugs", () => {
    assert.equal(
      normalizePageSlug("  Chính sách Đối tác!!!  "),
      "chinh-sach-doi-tac",
    );
    assert.throws(() => normalizePageSlug("---"), BadRequestException);
  });

  it("prefers a localized page slug and falls back to the base slug", () => {
    assert.deepEqual(localizedPageSlugCandidates("terms", "en-US"), [
      "terms-en",
      "terms",
    ]);
    assert.deepEqual(localizedPageSlugCandidates("terms", "id"), [
      "terms-id",
      "terms",
    ]);
    assert.deepEqual(localizedPageSlugCandidates("terms", "vi-VN"), [
      "terms",
    ]);
    assert.deepEqual(localizedPageSlugCandidates("terms", "invalid-locale"), [
      "terms",
    ]);
  });

  it("serializes Tiptap documents and rejects unsupported roots", () => {
    assert.equal(
      serializePageContent({ type: "doc", content: [] }),
      '{"type":"doc","content":[]}',
    );
    assert.throws(
      () => serializePageContent({ type: "paragraph" }),
      BadRequestException,
    );
  });

  it("removes scripts, event handlers and unsafe URL schemes", () => {
    const sanitized = sanitizePageContent(
      '<h1 onclick="alert(1)">Safe</h1><script>alert(1)</script><a href="javascript:alert(1)">Link</a>',
    );

    assert.equal(sanitized.includes("<script"), false);
    assert.equal(sanitized.includes("onclick"), false);
    assert.equal(sanitized.includes("javascript:"), false);
    assert.equal(sanitized.includes('rel="noopener noreferrer"'), true);
  });

  it("keeps heavy content out of list items and parses detail content safely", () => {
    const record = pageRecord('{"type":"doc","content":[]}');
    const listItem = mapPageListItem(record);
    const detail = mapPageDetail(record);
    const fallback = mapPageDetail(pageRecord("invalid-json"));

    assert.equal("contentJson" in listItem, false);
    assert.equal("contentHtml" in listItem, false);
    assert.deepEqual(detail.contentJson, { type: "doc", content: [] });
    assert.deepEqual(fallback.contentJson, {
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("sanitizes public content without exposing additional fields", () => {
    const page: PublicPageRecord = {
      title: "Privacy",
      slug: "privacy",
      excerpt: null,
      contentHtml: '<p onclick="alert(1)">Public</p>',
      featuredImage: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      canonicalUrl: null,
      robotsIndex: true,
      robotsFollow: true,
      publishedAt: createdAt,
    };

    const response = mapPublicPage(page);
    assert.equal(response.contentHtml, "<p>Public</p>");
    assert.deepEqual(Object.keys(response).sort(), Object.keys(page).sort());
  });
});
