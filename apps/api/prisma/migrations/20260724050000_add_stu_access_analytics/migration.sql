ALTER TABLE "stu_links"
  ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "user_agents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hash" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "browser" TEXT NOT NULL DEFAULT 'other',
    "os" TEXT NOT NULL DEFAULT 'other',
    "device_type" INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE "stu_access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "link_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "level_id" INTEGER,
    "visitor_identifier" TEXT,
    "agent_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ZZ',
    "device" INTEGER NOT NULL DEFAULT 2,
    "referrer" TEXT,
    "payout_cpm" DECIMAL NOT NULL DEFAULT 0,
    "rate_currency" TEXT NOT NULL DEFAULT 'USD',
    "daily_limit" INTEGER,
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "is_earn" BOOLEAN NOT NULL DEFAULT false,
    "detection_mask" INTEGER NOT NULL DEFAULT 0,
    "reject_reason_mask" INTEGER NOT NULL DEFAULT 0,
    "completed_at" DATETIME,
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stu_access_logs_link_id_fkey"
      FOREIGN KEY ("link_id") REFERENCES "stu_links" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stu_access_logs_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stu_access_logs_agent_hash_fkey"
      FOREIGN KEY ("agent_hash") REFERENCES "user_agents" ("hash")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "stu_daily_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stu_daily_stats_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "stu_access_aggregation_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minute_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "earned_views" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

CREATE UNIQUE INDEX "user_agents_hash_key" ON "user_agents"("hash");
CREATE INDEX "user_agents_browser_idx" ON "user_agents"("browser");
CREATE INDEX "user_agents_os_idx" ON "user_agents"("os");
CREATE INDEX "user_agents_device_type_idx" ON "user_agents"("device_type");

CREATE INDEX "stu_access_logs_link_id_created_at_idx"
  ON "stu_access_logs"("link_id", "created_at");
CREATE INDEX "stu_access_logs_user_id_created_at_idx"
  ON "stu_access_logs"("user_id", "created_at");
CREATE INDEX "stu_access_logs_ip_address_created_at_idx"
  ON "stu_access_logs"("ip_address", "created_at");
CREATE INDEX "stu_access_logs_agent_hash_idx"
  ON "stu_access_logs"("agent_hash");
CREATE INDEX "stu_access_logs_completed_at_processed_at_idx"
  ON "stu_access_logs"("completed_at", "processed_at");
CREATE INDEX "stu_access_logs_user_id_ip_address_completed_at_idx"
  ON "stu_access_logs"("user_id", "ip_address", "completed_at");

CREATE UNIQUE INDEX "stu_daily_stats_user_id_date_key"
  ON "stu_daily_stats"("user_id", "date");
CREATE INDEX "stu_daily_stats_date_idx" ON "stu_daily_stats"("date");

CREATE UNIQUE INDEX "stu_access_aggregation_runs_minute_key_key"
  ON "stu_access_aggregation_runs"("minute_key");
CREATE INDEX "stu_access_aggregation_runs_started_at_idx"
  ON "stu_access_aggregation_runs"("started_at");
