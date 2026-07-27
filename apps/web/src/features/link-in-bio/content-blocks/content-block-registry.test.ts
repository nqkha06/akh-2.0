import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  contentBlockRegistry,
  normalizeContentBlockSearch,
} from "./content-block-registry.ts";

describe("Link Bio content block registry", () => {
  it("registers all selectable Link Bio content blocks", () => {
    const enabledTypes = contentBlockRegistry
      .filter((definition) => definition.enabled)
      .map((definition) => definition.type);

    assert.ok(enabledTypes.includes("link"));
    assert.ok(enabledTypes.includes("gallery"));
    assert.ok(enabledTypes.includes("divider"));
    assert.ok(enabledTypes.includes("bank-details"));
  });

  it("normalizes Vietnamese search with or without diacritics", () => {
    assert.equal(normalizeContentBlockSearch("Bộ sưu tập ẢNH"), "bo suu tap anh");
    assert.equal(normalizeContentBlockSearch("Đường dẫn"), "duong dan");
  });
});
