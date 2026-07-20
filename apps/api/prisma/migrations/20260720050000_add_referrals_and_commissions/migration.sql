ALTER TABLE "users"
ADD COLUMN "referral_code" TEXT;

ALTER TABLE "users"
ADD COLUMN "referred_by" INTEGER
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

UPDATE "users"
SET "referral_code" = lower(hex(randomblob(6)))
WHERE "referral_code" IS NULL;

CREATE UNIQUE INDEX "users_referral_code_key"
ON "users"("referral_code");

CREATE INDEX "users_referred_by_idx"
ON "users"("referred_by");

CREATE TABLE "commissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "from_user_id" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "rate" DECIMAL NOT NULL,
    "commissionable_type" TEXT NOT NULL,
    "commissionable_id" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "commissions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commissions_from_user_id_fkey"
      FOREIGN KEY ("from_user_id") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "commissions_commissionable_type_commissionable_id_key"
ON "commissions"("commissionable_type", "commissionable_id");

CREATE INDEX "commissions_user_id_created_at_idx"
ON "commissions"("user_id", "created_at");

CREATE INDEX "commissions_from_user_id_created_at_idx"
ON "commissions"("from_user_id", "created_at");
