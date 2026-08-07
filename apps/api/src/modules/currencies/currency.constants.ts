export { FALLBACK_BASE_CURRENCY_CODE } from "@stu/contracts";
export const USER_CURRENCY_META_KEY = "preferences.currency";

export const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
export const EXCHANGE_RATE_PATTERN =
  /^(?:0|[1-9]\d{0,17})(?:\.\d{1,8})?$/;
