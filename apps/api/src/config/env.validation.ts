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

function optionalInteger(
  config: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
) {
  const value = config[key];
  if (value === undefined || value === "") return;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${key} phải là số nguyên từ ${minimum} đến ${maximum}.`);
  }
}

function optionalBoolean(config: Record<string, unknown>, key: string) {
  const value = config[key];
  if (value === undefined || value === "") return;
  if (value !== "true" && value !== "false") {
    throw new Error(`${key} chỉ nhận true hoặc false.`);
  }
}

function optionalCron(config: Record<string, unknown>, key: string) {
  const value = config[key];
  if (value === undefined || value === "") return;
  if (
    typeof value !== "string" ||
    ![5, 6].includes(value.trim().split(/\s+/).length)
  ) {
    throw new Error(`${key} phải là biểu thức cron gồm 5 hoặc 6 phần.`);
  }
}

function validateQueueEnvironment(config: Record<string, unknown>) {
  optionalBoolean(config, "QUEUE_ENABLED");
  optionalBoolean(config, "REDIS_TLS");
  optionalBoolean(config, "VISIT_AGGREGATION_DISABLED");
  optionalBoolean(config, "LOYALTY_ROLLUP_DISABLED");
  optionalBoolean(config, "SYSTEM_LOG_CLEANUP_DISABLED");
  optionalCron(config, "LOYALTY_ROLLUP_CRON");
  optionalInteger(config, "REDIS_PORT", 1, 65_535);
  optionalInteger(config, "REDIS_DB", 0, 15);
  optionalInteger(config, "VISIT_AGGREGATION_INTERVAL_MS", 10_000, 86_400_000);
  optionalInteger(config, "VISIT_AGGREGATION_BATCH_SIZE", 100, 10_000);
  optionalInteger(config, "VISIT_AGGREGATION_MAX_BATCHES_PER_JOB", 1, 100);
  optionalInteger(config, "SYSTEM_LOG_CLEANUP_INTERVAL_MS", 60_000, 2_592_000_000);
  optionalInteger(config, "SMTP_PORT", 1, 65_535);
  optionalInteger(config, "PASSWORD_RESET_TOKEN_TTL_MINUTES", 5, 1_440);
  optionalBoolean(config, "SMTP_SECURE");
  optionalBoolean(config, "EMAIL_DEBUG_MODE");

  const prefix = config.QUEUE_PREFIX;
  if (
    prefix !== undefined &&
    (typeof prefix !== "string" || !/^[a-z0-9_-]{2,40}$/i.test(prefix))
  ) {
    throw new Error(
      "QUEUE_PREFIX chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới.",
    );
  }

  if (
    config.NODE_ENV === "production" &&
    config.QUEUE_ENABLED !== "false" &&
    !String(config.REDIS_PASSWORD || "").trim()
  ) {
    throw new Error("REDIS_PASSWORD là bắt buộc khi chạy queue ở production.");
  }
}

function validateEmailProviderEnvironment(config: Record<string, unknown>) {
  const region = String(config.AWS_REGION || "").trim();
  if (region && !/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(region)) {
    throw new Error("AWS_REGION không đúng định dạng region AWS.");
  }
  const accessKey = String(config.AWS_ACCESS_KEY_ID || "").trim();
  const secretKey = String(config.AWS_SECRET_ACCESS_KEY || "").trim();
  if (Boolean(accessKey) !== Boolean(secretKey)) {
    throw new Error(
      "AWS_ACCESS_KEY_ID và AWS_SECRET_ACCESS_KEY phải được cấu hình cùng nhau.",
    );
  }
  const topics = String(config.AWS_SES_SNS_TOPIC_ARNS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    topics.some(
      (value) =>
        !/^arn:aws(?:-cn|-us-gov)?:sns:[^:]+:\d{12}:[A-Za-z0-9_-]+$/.test(
          value,
        ),
    )
  ) {
    throw new Error("AWS_SES_SNS_TOPIC_ARNS chứa ARN không hợp lệ.");
  }
}

export function validateEnvironment(config: Record<string, unknown>) {
  validateQueueEnvironment(config);
  validateEmailProviderEnvironment(config);
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

  validatePasswordResetEnvironment(config);

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

function validatePasswordResetEnvironment(config: Record<string, unknown>) {
  const resetUrl = String(config.PASSWORD_RESET_URL || "").trim();
  if (resetUrl) {
    let parsed: URL;
    try {
      parsed = new URL(resetUrl);
    } catch {
      throw new Error("PASSWORD_RESET_URL phải là URL HTTP(S) hợp lệ.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("PASSWORD_RESET_URL phải là URL HTTP(S) hợp lệ.");
    }
    if (config.NODE_ENV === "production" && parsed.protocol !== "https:") {
      throw new Error("PASSWORD_RESET_URL production bắt buộc dùng HTTPS.");
    }
  }

  if (config.NODE_ENV !== "production") return;
  for (const key of ["PASSWORD_RESET_URL", "SMTP_HOST", "MAIL_FROM"] as const) {
    if (!String(config[key] || "").trim()) {
      throw new Error(`${key} là bắt buộc trong production.`);
    }
  }
  if (String(config.SMTP_USER || "").trim() && !String(config.SMTP_PASSWORD || "")) {
    throw new Error("SMTP_PASSWORD là bắt buộc khi cấu hình SMTP_USER.");
  }
}

export function validateWorkerEnvironment(config: Record<string, unknown>) {
  validateQueueEnvironment(config);
  if (typeof config.DATABASE_URL !== "string" || !config.DATABASE_URL.trim()) {
    throw new Error("DATABASE_URL là bắt buộc cho worker.");
  }
  if (config.QUEUE_ENABLED === "false") {
    throw new Error("QUEUE_ENABLED phải là true khi khởi động worker.");
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
