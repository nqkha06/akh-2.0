/// <reference types="node" />

import { BadRequestException } from "@nestjs/common";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { UpdateUiTranslationsDto } from "../src/modules/languages/dto/update-ui-translations.dto";
import {
  mapLanguageResponse,
  parseLanguageUiMessages,
} from "../src/modules/languages/languages.mapper";
import {
  assertDefaultLanguagePublished,
  assertRequiredTranslationLocales,
  assertUniqueLanguageOrder,
  mergeLanguageUiMessages,
} from "../src/modules/languages/languages.policy";
import type { LanguageResponseRecord } from "../src/modules/languages/languages.select";

const language: LanguageResponseRecord = {
  id: 1,
  name: "Vietnamese",
  nativeName: "Tiếng Việt",
  locale: "vi",
  code: "vi",
  regional: "vi-VN",
  flag: "VN",
  isDefault: true,
  status: "published",
  isRtl: false,
  sortOrder: 10,
  uiMessagesJson: '{"Common.ok":"OK","invalid":1}',
  uiCatalogSize: 2,
  uiTranslationVersion: 3,
  uiUpdatedAt: null,
};

describe("Languages mapper and policy", () => {
  it("parses only string UI messages and preserves response visibility", () => {
    assert.deepEqual(parseLanguageUiMessages(language.uiMessagesJson), {
      "Common.ok": "OK",
    });
    assert.equal("status" in mapLanguageResponse(language, false), false);
    assert.equal(mapLanguageResponse(language, true).status, "published");
    assert.equal(
      mapLanguageResponse(language, true).uiTranslation.translatedKeys,
      1,
    );
  });

  it("requires every default language to be published", () => {
    assert.doesNotThrow(() =>
      assertDefaultLanguagePublished(true, "published"),
    );
    assert.throws(
      () => assertDefaultLanguagePublished(true, "draft"),
      BadRequestException,
    );
  });

  it("merges translations with optimistic-update semantics", () => {
    const dto = Object.assign(new UpdateUiTranslationsDto(), {
      version: 1,
      catalogSize: 2,
      entries: [{ key: "Common.save", value: "Lưu" }],
      removedKeys: ["Common.ok"],
    });
    assert.deepEqual(
      mergeLanguageUiMessages('{"Common.ok":"OK"}', dto),
      { "Common.save": "Lưu" },
    );

    const conflicting = Object.assign(new UpdateUiTranslationsDto(), {
      version: 1,
      catalogSize: 1,
      entries: [{ key: "Common.ok", value: "Đồng ý" }],
      removedKeys: ["Common.ok"],
    });
    assert.throws(
      () => mergeLanguageUiMessages("{}", conflicting),
      BadRequestException,
    );
  });

  it("validates reorder IDs and required translation locales", () => {
    assert.throws(() => assertUniqueLanguageOrder([1, 1]), BadRequestException);
    const languages = [
      { locale: "vi", isDefault: true },
      { locale: "en", isDefault: false },
    ];
    assert.doesNotThrow(() =>
      assertRequiredTranslationLocales(["vi", "en"], languages),
    );
    assert.throws(
      () => assertRequiredTranslationLocales(["en"], languages),
      BadRequestException,
    );
    assert.throws(
      () => assertRequiredTranslationLocales(["vi", "ja"], languages),
      BadRequestException,
    );
  });
});
