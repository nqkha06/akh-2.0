ALTER TABLE "users" ADD COLUMN "loyalty_tier_id" INTEGER
  REFERENCES "loyalty_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD COLUMN "loyalty_valid_views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "loyalty_window_started_at" DATETIME;
ALTER TABLE "users" ADD COLUMN "loyalty_window_ended_at" DATETIME;
ALTER TABLE "users" ADD COLUMN "loyalty_calculated_at" DATETIME;

CREATE INDEX "users_loyalty_tier_id_idx" ON "users"("loyalty_tier_id");

CREATE TABLE "loyalty_rollup_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "processed_users" INTEGER NOT NULL DEFAULT 0,
    "promoted_users" INTEGER NOT NULL DEFAULT 0,
    "total_valid_views" INTEGER NOT NULL DEFAULT 0,
    "window_started_at" DATETIME NOT NULL,
    "window_ended_at" DATETIME NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

CREATE UNIQUE INDEX "loyalty_rollup_runs_day_key_key"
  ON "loyalty_rollup_runs"("day_key");
CREATE INDEX "loyalty_rollup_runs_started_at_idx"
  ON "loyalty_rollup_runs"("started_at");
