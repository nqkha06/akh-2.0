import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getLinkAnimationClassName,
  getLinkAnimationStyle,
  linkAnimationPresets,
  normalizeLinkAnimationEffect,
} from "./link-animation.ts";

describe("Link Bio link animations", () => {
  it("defines all supported presets", () => {
    assert.deepEqual(linkAnimationPresets.map(({ effect }) => effect), [
      "none",
      "pulse",
      "shake",
      "bounce",
      "glow",
    ]);
  });

  it("treats missing and legacy values as no animation", () => {
    assert.equal(normalizeLinkAnimationEffect(undefined), "none");
    assert.equal(normalizeLinkAnimationEffect("legacy-effect"), "none");
    assert.equal(getLinkAnimationClassName(undefined), "");
  });

  it("uses a stable CSS-only stagger based on content order", () => {
    const style = getLinkAnimationStyle(3) as Record<string, string>;
    assert.equal(style["--link-animation-delay"], "540ms");
    assert.match(getLinkAnimationClassName("glow"), /link-bio-animation--glow/);
  });
});
