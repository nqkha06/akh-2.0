/// <reference types="node" />

import {
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertPageCanPublish,
  assertPageStatusTransition,
} from "../src/modules/pages/pages.policy";

describe("Pages policy", () => {
  it("requires the pages.publish permission", () => {
    assert.doesNotThrow(() =>
      assertPageCanPublish({ permissions: ["pages.publish"] }),
    );
    assert.throws(
      () => assertPageCanPublish({ permissions: ["pages.update"] }),
      ForbiddenException,
    );
  });

  it("accepts current lifecycle transitions and idempotent status changes", () => {
    assert.doesNotThrow(() => assertPageStatusTransition("DRAFT", "DRAFT"));
    assert.doesNotThrow(() =>
      assertPageStatusTransition("DRAFT", "PUBLISHED"),
    );
    assert.doesNotThrow(() =>
      assertPageStatusTransition("PUBLISHED", "ARCHIVED"),
    );
    assert.doesNotThrow(() =>
      assertPageStatusTransition("ARCHIVED", "DRAFT"),
    );
  });

  it("rejects publishing an archived page directly", () => {
    assert.throws(
      () => assertPageStatusTransition("ARCHIVED", "PUBLISHED"),
      BadRequestException,
    );
  });
});
