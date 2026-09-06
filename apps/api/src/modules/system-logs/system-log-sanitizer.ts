import { Prisma } from "@prisma/client";

const MAX_DEPTH = 8;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_KEYS = 100;
const MAX_STRING_LENGTH = 20_000;
const REDACTED = "[REDACTED]";

const sensitiveKeys = new Set([
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "setcookie",
  "secret",
  "apikey",
  "clientsecret",
]);

export function sanitizeSystemLogMetadata(value: unknown) {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return sanitizeValue(value, 0, new WeakSet<object>()) as Prisma.InputJsonValue;
}

export function sanitizeSystemLogText(value: unknown, maxLength = MAX_STRING_LENGTH) {
  const text = String(value ?? "")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(
      /\b(password|token|accessToken|refreshToken|authorization|cookie|secret|apiKey)\s*[:=]\s*([^\s,;]+)/gi,
      "$1=[REDACTED]",
    );
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): Prisma.JsonValue {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH]";
  if (value === null) return null;
  if (typeof value === "string") return sanitizeSystemLogText(value);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeSystemLogText(value.message),
      stack: sanitizeSystemLogText(value.stack ?? ""),
    };
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, depth + 1, seen));
  }
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  const output: Record<string, Prisma.JsonValue> = {};
  for (const [key, item] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
    output[key] = isSensitiveKey(key)
      ? REDACTED
      : sanitizeValue(item, depth + 1, seen);
  }
  seen.delete(value);
  return output;
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    sensitiveKeys.has(normalized) ||
    normalized.endsWith("password") ||
    normalized.endsWith("secret") ||
    normalized.endsWith("apikey") ||
    normalized.endsWith("accesstoken") ||
    normalized.endsWith("refreshtoken")
  );
}
