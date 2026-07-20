const DURATION_PATTERN = /^\d+(ms|s|m|h|d)$/;

function requireSecret(config: Record<string, unknown>, key: string) {
  const value = config[key];
  if (typeof value !== "string" || value.length < 32) {
    throw new Error(`${key} phải có ít nhất 32 ký tự.`);
  }
  return value;
}

function requireDuration(config: Record<string, unknown>, key: string) {
  const value = config[key];
  if (typeof value !== "string" || !DURATION_PATTERN.test(value)) {
    throw new Error(`${key} phải có dạng như 15m, 7d hoặc 3600s.`);
  }
}

export function validateEnvironment(config: Record<string, unknown>) {
  const accessSecret = requireSecret(config, "JWT_ACCESS_SECRET");
  const refreshSecret = requireSecret(config, "JWT_REFRESH_SECRET");

  if (accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET và JWT_REFRESH_SECRET phải khác nhau.");
  }

  if (
    config.NODE_ENV === "production" &&
    (accessSecret.includes("replace-with") || refreshSecret.includes("replace-with"))
  ) {
    throw new Error("JWT secret production không được dùng giá trị placeholder.");
  }

  requireDuration(config, "JWT_ACCESS_EXPIRES_IN");
  requireDuration(config, "JWT_REFRESH_EXPIRES_IN");

  if (typeof config.FRONTEND_ORIGIN !== "string" || !config.FRONTEND_ORIGIN.trim()) {
    throw new Error("FRONTEND_ORIGIN là bắt buộc.");
  }

  const sameSite = config.AUTH_COOKIE_SAME_SITE;
  if (sameSite && !["lax", "strict", "none"].includes(String(sameSite))) {
    throw new Error("AUTH_COOKIE_SAME_SITE chỉ nhận lax, strict hoặc none.");
  }

  if (config.NODE_ENV === "production" && config.AUTH_COOKIE_SECURE === "false") {
    throw new Error("AUTH_COOKIE_SECURE không được là false trong production.");
  }


  if (sameSite === "none" && config.AUTH_COOKIE_SECURE === "false") {
    throw new Error("Cookie SameSite=none bắt buộc phải bật Secure.");
  }

  return config;
}

export function parseDurationMs(value: string) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
  if (!match) throw new Error(`Thời lượng không hợp lệ: ${value}`);

  const amount = Number(match[1]);
  const multipliers = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[match[2] as keyof typeof multipliers];
}
