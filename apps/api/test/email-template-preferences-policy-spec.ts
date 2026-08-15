/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";

import {
  htmlToPlainText,
  sanitizeEmailHtml,
  validateTemplateVariables,
} from "../src/modules/emails/email-template.policy";
import {
  assertMarketingEligible,
  assertPreferenceChangeAllowed,
} from "../src/modules/emails/email-preferences.policy";

const variable = {
  key: "user.name",
  label: "User name",
  type: "string" as const,
  required: true,
  example: "An Nguyen",
  description: "Recipient display name",
};

describe("Email template and preference policies", () => {
  it("rejects undeclared variables and active templates without required samples", () => {
    assert.throws(
      () => validateTemplateVariables({
        subject: "Hello {{user.name}}",
        htmlContent: "<p>{{resetUrl}}</p>",
        variables: [variable],
        status: "draft",
      }),
      BadRequestException,
    );
    assert.throws(
      () => validateTemplateVariables({
        subject: "Hello {{user.name}}",
        htmlContent: "<p>Welcome</p>",
        variables: [{ ...variable, example: "" }],
        status: "active",
      }),
      BadRequestException,
    );
  });

  it("sanitizes executable HTML and generates a plain-text fallback", () => {
    const safe = sanitizeEmailHtml(
      '<script>alert(1)</script><iframe src="https://evil.example"></iframe><a href="javascript:alert(1)" onclick="alert(1)">Hello</a><p style="background-image:url(javascript:alert(1))">World</p>',
    );
    assert.doesNotMatch(safe, /script|iframe|onclick|javascript:/i);
    assert.match(safe, /rel="noopener noreferrer"/);
    assert.equal(htmlToPlainText("<h1>Hello</h1><p>World</p>"), "Hello\nWorld");
  });

  it("enforces marketing opt-in, active user, verified sender and suppression rules", () => {
    const eligible = {
      marketingEnabled: true,
      senderVerified: true,
      userActive: true,
      topicEnabled: true,
      topicRequired: false,
      subscribed: true,
      suppressed: false,
    };
    assert.doesNotThrow(() => assertMarketingEligible(eligible));
    assert.throws(
      () => assertMarketingEligible({ ...eligible, subscribed: false }),
      BadRequestException,
    );
    assert.throws(
      () => assertMarketingEligible({ ...eligible, suppressed: true }),
      BadRequestException,
    );
    assert.throws(
      () => assertPreferenceChangeAllowed({
        category: "transactional",
        isRequired: false,
        isSubscribed: false,
      }),
      BadRequestException,
    );
  });
});
