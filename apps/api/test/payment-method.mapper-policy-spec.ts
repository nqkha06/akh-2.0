/// <reference types="node" />

import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PaymentMethodFieldDto } from "../src/modules/payment-methods/dto/payment-method-field.dto";
import { PaymentMethodTranslationDto } from "../src/modules/payment-methods/dto/payment-method-translation.dto";
import {
  mapAdminPaymentMethod,
  normalizePaymentMethodFields,
  parsePaymentMethodDetails,
  parsePaymentMethodFields,
  paymentMethodFieldSignature,
} from "../src/modules/payment-methods/payment-method.mapper";
import {
  assertPaymentFieldSchemaCanChange,
  assertPaymentTranslationsCompatible,
  validatePaymentMethodDetails,
} from "../src/modules/payment-methods/payment-method.policy";
import type { PaymentMethodRecord } from "../src/modules/payment-methods/payment-method.select";

function field(
  key: string,
  label: string,
  type: PaymentMethodFieldDto["type"] = "text",
) {
  return Object.assign(new PaymentMethodFieldDto(), {
    key,
    label,
    type,
    required: true,
    placeholder: "  Example  ",
  });
}

function translation(locale: string, fields: PaymentMethodFieldDto[]) {
  return Object.assign(new PaymentMethodTranslationDto(), {
    locale,
    name: locale === "vi" ? "Ngân hàng" : "Bank",
    fields,
  });
}

describe("Payment method mapper and policy", () => {
  it("normalizes and safely parses field definitions", () => {
    const fields = [field("account", "  Account  ")];
    assert.deepEqual(normalizePaymentMethodFields(fields), [
      {
        key: "account",
        label: "Account",
        type: "text",
        required: true,
        placeholder: "Example",
      },
    ]);
    assert.equal(paymentMethodFieldSignature(fields), "account:text:true");
    assert.equal(
      parsePaymentMethodFields(JSON.stringify(normalizePaymentMethodFields(fields)))
        .length,
      1,
    );
    assert.deepEqual(parsePaymentMethodFields('[{"key":"x"}]'), []);
  });

  it("requires matching, non-duplicated field schemas across translations", () => {
    assert.doesNotThrow(() =>
      assertPaymentTranslationsCompatible([
        translation("vi", [field("account", "Tài khoản")]),
        translation("en", [field("account", "Account")]),
      ]),
    );
    assert.throws(
      () =>
        assertPaymentTranslationsCompatible([
          translation("vi", [field("account", "A"), field("account", "B")]),
        ]),
      BadRequestException,
    );
    assert.throws(
      () =>
        assertPaymentTranslationsCompatible([
          translation("vi", [field("account", "A")]),
          translation("en", [field("email", "Email", "email")]),
        ]),
      BadRequestException,
    );
  });

  it("validates member details using the preferred locale schema", () => {
    const method = {
      translations: [
        {
          locale: "vi",
          fieldsJson: JSON.stringify([
            {
              key: "email",
              label: "Email",
              type: "email",
              required: true,
            },
          ]),
        },
      ],
    };
    assert.deepEqual(
      validatePaymentMethodDetails(method, { email: " test@example.com " }),
      { email: "test@example.com" },
    );
    assert.throws(
      () => validatePaymentMethodDetails(method, { email: "invalid" }),
      BadRequestException,
    );
    assert.throws(
      () => validatePaymentMethodDetails(method, { unsupported: "x" }),
      BadRequestException,
    );
  });

  it("normalizes and validates select options", () => {
    const bankField = Object.assign(new PaymentMethodFieldDto(), {
      key: "bank_code",
      label: "Ngân hàng",
      type: "select" as const,
      required: true,
      options: [
        { value: " VCB ", label: " Vietcombank " },
        { value: "ACB", label: "ACB" },
      ],
    });
    const normalized = normalizePaymentMethodFields([bankField]);
    assert.deepEqual(normalized[0]?.options, [
      { value: "VCB", label: "Vietcombank" },
      { value: "ACB", label: "ACB" },
    ]);
    assert.doesNotThrow(() =>
      assertPaymentTranslationsCompatible([
        translation("vi", [bankField]),
        translation("en", [
          Object.assign(new PaymentMethodFieldDto(), {
            ...bankField,
            label: "Bank",
            options: [
              { value: "VCB", label: "Vietcombank" },
              { value: "ACB", label: "ACB" },
            ],
          }),
        ]),
      ]),
    );
    assert.throws(
      () =>
        assertPaymentTranslationsCompatible([
          translation("vi", [bankField]),
          translation("en", [
            Object.assign(new PaymentMethodFieldDto(), {
              ...bankField,
              options: [{ value: "VCB", label: "Vietcombank" }],
            }),
          ]),
        ]),
      BadRequestException,
    );
    const method = {
      translations: [
        {
          locale: "vi",
          fieldsJson: JSON.stringify(normalized),
        },
      ],
    };
    assert.deepEqual(validatePaymentMethodDetails(method, { bank_code: "VCB" }), {
      bank_code: "VCB",
    });
    assert.throws(
      () => validatePaymentMethodDetails(method, { bank_code: "INVALID" }),
      BadRequestException,
    );
  });

  it("protects field schemas after member adoption", () => {
    assert.throws(
      () =>
        assertPaymentFieldSchemaCanChange(
          1,
          [field("account", "Account")],
          [field("email", "Email", "email")],
        ),
      ConflictException,
    );
    assert.doesNotThrow(() =>
      assertPaymentFieldSchemaCanChange(
        0,
        [field("account", "Account")],
        [field("email", "Email", "email")],
      ),
    );
  });

  it("preserves decimal, date and count response shapes", () => {
    const now = new Date("2026-08-08T00:00:00.000Z");
    const record: PaymentMethodRecord = {
      id: 1,
      withdrawFee: new Prisma.Decimal("5.25"),
      minWithdrawAmount: new Prisma.Decimal("100"),
      status: "published",
      createdAt: now,
      updatedAt: now,
      translations: [
        {
          id: 1,
          locale: "vi",
          paymentMethodId: 1,
          name: "Ngân hàng",
          fieldsJson: "[]",
        },
      ],
      _count: { userMethods: 2 },
    };
    const response = mapAdminPaymentMethod(record);
    assert.equal(response.withdrawFee, "5.25");
    assert.equal(response.createdAt, now.toISOString());
    assert.equal(response.userMethodCount, 2);
    assert.deepEqual(parsePaymentMethodDetails('{"account":"123","bad":1}'), {
      account: "123",
    });
  });
});
