/// <reference types="node" />

import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma, type Currency } from "@prisma/client";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CreateCurrencyDto } from "../src/modules/currencies/dto/create-currency.dto";
import { UpdateCurrencyDto } from "../src/modules/currencies/dto/update-currency.dto";
import {
  mapCurrencyResponse,
  parseUserCurrencyMeta,
} from "../src/modules/currencies/currency.mapper";
import {
  assertCurrencyCanBeRemoved,
  assertCurrencyCreateInput,
  assertCurrencyIsUnused,
  assertCurrencyUpdateAllowed,
} from "../src/modules/currencies/currency.policy";

const currency: Currency = {
  id: 1,
  code: "USD",
  name: "US Dollar",
  symbol: "$",
  exchangeRate: new Prisma.Decimal(1),
  decimalDigits: 2,
  isBase: true,
  isDefault: true,
  isActive: true,
  sortOrder: 10,
  createdAt: new Date("2026-08-08T00:00:00.000Z"),
  updatedAt: new Date("2026-08-08T00:00:00.000Z"),
};

describe("Currency mapper and policy", () => {
  it("maps decimals to the existing string response and parses user meta", () => {
    assert.equal(mapCurrencyResponse(currency).exchangeRate, "1");
    assert.equal(parseUserCurrencyMeta(JSON.stringify("USD")), "USD");
    assert.equal(parseUserCurrencyMeta("{}"), null);
    assert.equal(parseUserCurrencyMeta("invalid"), null);
  });

  it("validates create names, symbols and positive rates", () => {
    const valid = Object.assign(new CreateCurrencyDto(), {
      code: "VND",
      name: "Vietnamese đồng",
      symbol: "₫",
      exchangeRate: "25000",
      decimalDigits: 0,
      isDefault: false,
      isActive: true,
      sortOrder: 20,
    });
    assert.doesNotThrow(() => assertCurrencyCreateInput(valid));
    assert.throws(
      () => assertCurrencyCreateInput({ ...valid, exchangeRate: "0" }),
      BadRequestException,
    );
    assert.throws(
      () => assertCurrencyCreateInput({ ...valid, name: " " }),
      BadRequestException,
    );
  });

  it("protects base/default currency invariants during updates", () => {
    assert.throws(
      () =>
        assertCurrencyUpdateAllowed(
          currency,
          Object.assign(new UpdateCurrencyDto(), { exchangeRate: "2" }),
        ),
      BadRequestException,
    );
    assert.throws(
      () =>
        assertCurrencyUpdateAllowed(
          currency,
          Object.assign(new UpdateCurrencyDto(), { isActive: false }),
        ),
      BadRequestException,
    );
  });

  it("blocks deletion of protected or selected currencies", () => {
    assert.throws(
      () => assertCurrencyCanBeRemoved(currency),
      ConflictException,
    );
    assert.throws(() => assertCurrencyIsUnused(2), ConflictException);
    assert.doesNotThrow(() => assertCurrencyIsUnused(0));
  });
});
