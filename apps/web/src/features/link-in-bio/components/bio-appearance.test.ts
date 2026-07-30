import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getBioLinkClass,
  isDarkBioButtonStyle,
  normalizeBioButtonStyle,
} from "./bio-appearance.ts";

describe("Link Bio button appearance", () => {
  it("treats the default rounded button as a dark surface", () => {
    assert.equal(isDarkBioButtonStyle("rounded"), true);
    assert.equal(isDarkBioButtonStyle("minimalist"), false);
    assert.equal(isDarkBioButtonStyle("legacy"), true);
  });

  it("keeps unknown legacy styles on the safe default", () => {
    assert.equal(normalizeBioButtonStyle("legacy"), "rounded");
  });

  it("uses the compact shared layout for public and editor renderers", () => {
    const className = getBioLinkClass("rounded");
    assert.match(className, /min-h-16/);
    assert.match(className, /bg-slate-950/);
    assert.doesNotMatch(className, /min-h-20/);
  });
});
