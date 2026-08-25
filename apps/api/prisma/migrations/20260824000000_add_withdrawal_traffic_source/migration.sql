ALTER TABLE "business_settings"
  ADD COLUMN "require_withdrawal_traffic_source" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "user_withdrawals"
  ADD COLUMN "traffic_source" TEXT;
