-- Existing password users are trusted during rollout so enabling the policy does not lock them out.
UPDATE "users"
SET "email_verified_at" = CURRENT_TIMESTAMP
WHERE "password" IS NOT NULL AND "email_verified_at" IS NULL;

CREATE TABLE "email_verification_tokens" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" DATETIME NOT NULL,
  "used_at" DATETIME,
  "requested_ip" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key"
ON "email_verification_tokens"("token_hash");

CREATE INDEX "email_verification_tokens_user_id_used_at_expires_at_idx"
ON "email_verification_tokens"("user_id", "used_at", "expires_at");

CREATE INDEX "email_verification_tokens_expires_at_idx"
ON "email_verification_tokens"("expires_at");
