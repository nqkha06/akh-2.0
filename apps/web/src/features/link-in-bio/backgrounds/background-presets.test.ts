import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bioBackgroundPresets,
  getBioBackgroundPresetById,
  getBioPresetTheme,
} from "./background-presets.ts";

describe("Link Bio background presets", () => {
  it("registers the complete 9:16 background collection", () => {
    assert.equal(bioBackgroundPresets.length, 9);
    assert.equal(new Set(bioBackgroundPresets.map((preset) => preset.id)).size, 9);
    assert.ok(bioBackgroundPresets.every((preset) => preset.id.startsWith("preset:")));
    assert.ok(bioBackgroundPresets.every((preset) => preset.imageUrl.endsWith("-9x16.jpg")));
  });

  it("resolves a saved preset id", () => {
    const preset = getBioBackgroundPresetById("preset:cobalt-snowfall");

    assert.equal(preset?.name, "Tuyết xanh cobalt");
    assert.equal(preset?.imageUrl, "/assets/images/bios/25-cobalt-snowfall-9x16.jpg");
    assert.equal(preset?.theme.buttonColor, "#dbeafe");
    assert.ok(preset?.theme.sectionColor);
  });

  it("keeps a legacy custom accent when no preset was saved", () => {
    const theme = getBioPresetTheme(undefined, "/legacy/background.jpg", "#7c3aed");

    assert.equal(theme.accentColor, "#7c3aed");
    assert.equal(theme.buttonColor, "#7c3aed");
  });
});
