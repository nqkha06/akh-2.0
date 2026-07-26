CREATE TABLE "loyalty_tiers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "minimum_valid_views" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "icon_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE "loyalty_tier_translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tier_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "benefits" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "loyalty_tier_translations_tier_id_fkey"
      FOREIGN KEY ("tier_id") REFERENCES "loyalty_tiers" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "loyalty_tiers_key_key"
  ON "loyalty_tiers"("key");
CREATE INDEX "loyalty_tiers_status_sort_order_idx"
  ON "loyalty_tiers"("status", "sort_order");
CREATE INDEX "loyalty_tiers_status_minimum_valid_views_idx"
  ON "loyalty_tiers"("status", "minimum_valid_views");
CREATE UNIQUE INDEX "loyalty_tier_translations_tier_id_locale_key"
  ON "loyalty_tier_translations"("tier_id", "locale");
CREATE INDEX "loyalty_tier_translations_locale_idx"
  ON "loyalty_tier_translations"("locale");

CREATE INDEX "stu_access_logs_user_id_is_earn_completed_at_idx"
  ON "stu_access_logs"("user_id", "is_earn", "completed_at");
