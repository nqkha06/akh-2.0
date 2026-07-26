import type { ConfigService } from "@nestjs/config";
import type { ConnectionOptions } from "bullmq";

function integerSetting(
  config: ConfigService,
  key: string,
  fallback: number,
) {
  const parsed = Number(config.get<string>(key));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function redisConnection(config: ConfigService): ConnectionOptions {
  const username = config.get<string>("REDIS_USERNAME")?.trim();
  const password = config.get<string>("REDIS_PASSWORD")?.trim();
  const tlsEnabled = config.get<string>("REDIS_TLS") === "true";

  return {
    host: config.get<string>("REDIS_HOST")?.trim() || "127.0.0.1",
    port: integerSetting(config, "REDIS_PORT", 6379),
    db: integerSetting(config, "REDIS_DB", 0),
    username: username || undefined,
    password: password || undefined,
    tls: tlsEnabled ? {} : undefined,
    connectTimeout: 10_000,
    enableReadyCheck: true,
    keepAlive: 10_000,
    maxRetriesPerRequest: null,
  };
}

