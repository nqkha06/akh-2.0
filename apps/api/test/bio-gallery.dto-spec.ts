/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { CreateBioPageDto } from "../src/modules/bio-pages/dto/create-bio-page.dto";

function validPayload() {
  return {
    name: "Creator",
    status: "draft",
    socialLinks: [],
    customLinks: [],
    widgets: [],
    hiddenLinks: [],
    galleries: [{
      id: "gallery-1",
      type: "gallery",
      title: "Dự án",
      enabled: true,
      showTitle: true,
      displayMode: "grid",
      aspectRatio: "1:1",
      columns: { mobile: 2, tablet: 3, desktop: 4 },
      gap: "md",
      radius: "md",
      showCaption: true,
      border: "subtle",
      shadow: "sm",
      images: [{
        id: "image-1",
        fileId: "1",
        url: "/api/backend/member/files/1/preview",
        alt: "Ảnh dự án",
        linkUrl: "https://example.com/project",
        openInNewTab: true,
        sortOrder: 0,
        width: 1200,
        height: 800,
      }],
    }],
    dividers: [] as Array<Record<string, unknown>>,
    bankDetails: [] as Array<Record<string, unknown>>,
    contentOrder: [{ type: "gallery", id: "gallery-1" }],
    appearance: {
      buttonStyle: "rounded",
      backgroundColor: "#ffffff",
      avatarFileId: undefined as string | undefined,
      backgroundFileId: undefined as string | undefined,
      backgroundMediaType: undefined as "image" | "video" | "youtube" | undefined,
      backgroundMediaUrl: undefined as string | undefined,
    },
  };
}

describe("Bio gallery DTO", () => {
  it("accepts a complete gallery configuration", async () => {
    const errors = await validate(plainToInstance(CreateBioPageDto, validPayload()));
    assert.equal(errors.length, 0);
  });

  it("accepts Media Manager references for avatar and image background", async () => {
    const payload = validPayload();
    payload.appearance = {
      ...payload.appearance,
      avatarFileId: "1",
      backgroundFileId: "1",
      backgroundMediaType: "image",
      backgroundMediaUrl: "https://example.com/api/backend/member/files/1/preview",
    };
    const errors = await validate(plainToInstance(CreateBioPageDto, payload));
    assert.equal(errors.length, 0);
  });

  it("rejects malformed Media Manager file identifiers", async () => {
    const payload = validPayload();
    payload.appearance = { ...payload.appearance, avatarFileId: "x".repeat(33) };
    const errors = await validate(plainToInstance(CreateBioPageDto, payload));
    assert.ok(errors.length > 0);
  });

  it("rejects unsafe links, invalid breakpoints and more than 20 images", async () => {
    const payload = validPayload();
    payload.galleries[0].columns.mobile = 5;
    payload.galleries[0].images[0].linkUrl = "javascript:alert(1)";
    payload.galleries[0].images = Array.from({ length: 21 }, (_, index) => ({
      ...payload.galleries[0].images[0],
      id: `image-${index}`,
      fileId: String(index + 1),
      sortOrder: index,
    }));
    const errors = await validate(plainToInstance(CreateBioPageDto, payload));
    assert.ok(errors.length > 0);
  });

  it("accepts divider and bank details blocks", async () => {
    const payload = validPayload();
    payload.dividers = [{
      id: "divider-1",
      type: "divider",
      enabled: true,
      label: "Ủng hộ tác giả",
      showLabel: true,
      style: "dashed",
      spacing: "md",
    }];
    payload.bankDetails = [{
      id: "bank-1",
      type: "bank-details",
      enabled: true,
      title: "Thông tin chuyển khoản",
      bankName: "Ngân hàng mẫu",
      accountName: "NGUYEN VAN A",
      accountNumber: "123456789",
      branch: "Hà Nội",
      note: "Nội dung chuyển khoản: Ung ho",
      showCopyButton: true,
    }];
    payload.contentOrder = [
      { type: "divider", id: "divider-1" },
      { type: "bank-details", id: "bank-1" },
    ];
    const errors = await validate(plainToInstance(CreateBioPageDto, payload));
    assert.equal(errors.length, 0);
  });

  it("rejects an unsupported divider style", async () => {
    const payload = validPayload();
    payload.dividers = [{
      id: "divider-1",
      type: "divider",
      enabled: true,
      showLabel: false,
      style: "double",
      spacing: "md",
    }];
    const errors = await validate(plainToInstance(CreateBioPageDto, payload));
    assert.ok(errors.length > 0);
  });

  it("accepts known link animations and rejects unknown presets", async () => {
    const valid = {
      ...validPayload(),
      customLinks: [{
        id: "link-1",
        title: "Portfolio",
        url: "https://example.com",
        animationEffect: "glow",
      }],
    };
    assert.equal((await validate(plainToInstance(CreateBioPageDto, valid))).length, 0);

    const invalid = {
      ...valid,
      customLinks: [{ ...valid.customLinks[0], animationEffect: "flash" }],
    };
    assert.ok((await validate(plainToInstance(CreateBioPageDto, invalid))).length > 0);
  });
});
