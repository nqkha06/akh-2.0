import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractMemberPreviewFileId,
  getLinkAppearanceMediaFileId,
} from "../src/modules/files/files.service";

describe("public link appearance media", () => {
  it("extracts member preview IDs from relative and absolute BFF URLs", () => {
    assert.equal(
      extractMemberPreviewFileId("/api/backend/member/files/21/preview"),
      21,
    );
    assert.equal(
      extractMemberPreviewFileId(
        "https://link4sub.test/api/backend/member/files/42/preview",
      ),
      42,
    );
  });

  it("rejects unrelated or malformed URLs", () => {
    assert.equal(extractMemberPreviewFileId("https://example.com/photo.jpg"), null);
    assert.equal(extractMemberPreviewFileId("/member/files/not-a-number/preview"), null);
    assert.equal(extractMemberPreviewFileId("javascript:alert(1)"), null);
  });

  it("selects cover and background media without exposing another file", () => {
    const appearanceJson = JSON.stringify({
      coverImageUrl: "/api/backend/member/files/11/preview",
      backgroundSettings: {
        sameAsCoverImage: false,
        backgroundMediaUrl: "/api/backend/member/files/12/preview",
      },
    });

    assert.equal(getLinkAppearanceMediaFileId(appearanceJson, "cover"), 11);
    assert.equal(getLinkAppearanceMediaFileId(appearanceJson, "background"), 12);
  });

  it("uses the cover when the background is configured to match it", () => {
    const appearanceJson = JSON.stringify({
      coverImageUrl: "/api/backend/member/files/13/preview",
      backgroundSettings: {
        sameAsCoverImage: true,
        backgroundMediaUrl: "/api/backend/member/files/99/preview",
      },
    });

    assert.equal(getLinkAppearanceMediaFileId(appearanceJson, "background"), 13);
  });
});
