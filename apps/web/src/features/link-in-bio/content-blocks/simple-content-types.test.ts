import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBankDetailsBlock,
  createDividerBlock,
  hasCompleteBankDetails,
} from "./simple-content-types.ts";

describe("Simple Link Bio content block defaults", () => {
  it("creates a visible divider with system defaults", () => {
    const block = createDividerBlock("divider-1");
    assert.equal(block.enabled, true);
    assert.equal(block.style, "solid");
    assert.equal(block.spacing, "md");
  });

  it("requires the three essential bank fields", () => {
    const block = createBankDetailsBlock("bank-1");
    assert.equal(hasCompleteBankDetails(block), false);
    assert.equal(hasCompleteBankDetails({
      ...block,
      bankName: "Ngân hàng mẫu",
      accountName: "NGUYEN VAN A",
      accountNumber: "123456789",
    }), true);
  });
});
