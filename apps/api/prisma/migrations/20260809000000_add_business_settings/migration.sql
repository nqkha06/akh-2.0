CREATE TABLE "business_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "registration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_verification_required" BOOLEAN NOT NULL DEFAULT false,
    "google_login_enabled" BOOLEAN NOT NULL DEFAULT true,
    "base_currency_code" TEXT NOT NULL DEFAULT 'USD',
    "withdrawal_currency_code" TEXT NOT NULL DEFAULT 'USD',
    "referral_commission_rate" DECIMAL NOT NULL DEFAULT 5,
    "loyalty_window_days" INTEGER NOT NULL DEFAULT 7,
    "loyalty_history_days" INTEGER NOT NULL DEFAULT 7,
    "member_file_max_bytes" BIGINT NOT NULL DEFAULT 104857600,
    "cover_image_max_bytes" BIGINT NOT NULL DEFAULT 10485760,
    "admin_media_max_bytes" BIGINT NOT NULL DEFAULT 10485760,
    "support_attachment_max_bytes" BIGINT NOT NULL DEFAULT 5242880,
    "member_storage_quota_bytes" BIGINT NOT NULL DEFAULT 1073741824,
    "upload_allowed_mime_types" TEXT NOT NULL DEFAULT '[]',
    "background_images" TEXT NOT NULL DEFAULT '[]',
    "background_videos" TEXT NOT NULL DEFAULT '[]',
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "withdrawals_paused" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_settings_updated_by_id_fkey"
      FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "business_settings_updated_by_id_idx"
  ON "business_settings"("updated_by_id");

INSERT INTO "business_settings" ("id", "base_currency_code", "withdrawal_currency_code")
SELECT 1,
       COALESCE((SELECT "code" FROM "currencies" WHERE "is_base" = true LIMIT 1), 'USD'),
       COALESCE((SELECT "code" FROM "currencies" WHERE "is_base" = true LIMIT 1), 'USD')
WHERE NOT EXISTS (SELECT 1 FROM "business_settings" WHERE "id" = 1);

ALTER TABLE "user_withdrawals" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "user_withdrawals" ADD COLUMN "exchange_rate" DECIMAL NOT NULL DEFAULT 1;

UPDATE "user_withdrawals"
SET "currency" = (SELECT "base_currency_code" FROM "business_settings" WHERE "id" = 1),
    "exchange_rate" = 1;
