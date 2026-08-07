import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bioButtonStyles,
  getBioLinkClass,
  normalizeBioButtonStyle,
} from "./bio-appearance.ts";

describe("Link Bio button appearance", () => {
  it("only exposes the three beginner-friendly border shapes", () => {
    assert.deepEqual(
      bioButtonStyles.map((style) => style.value),
      ["rounded", "rounded-border", "mineral-square"],
    );
  });

  it("maps old styles to the simplified choices", () => {
    assert.equal(normalizeBioButtonStyle("neon-outline"), "rounded-border");
    assert.equal(normalizeBioButtonStyle("compact-sharp"), "mineral-square");
    assert.equal(normalizeBioButtonStyle("legacy"), "rounded");
  });

  it("uses the premium touch-friendly layout for public and editor renderers", () => {
    const className = getBioLinkClass("rounded");
    assert.match(className, /min-h-\[4\.25rem\]/);
    assert.match(className, /rounded-2xl/);
    assert.doesNotMatch(className, /min-h-20/);
  });
});
