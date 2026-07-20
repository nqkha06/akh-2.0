-- Preserve the immediately previous token fingerprint so a concurrent refresh
-- can be distinguished from a replay outside the grace window.
ALTER TABLE "auth_sessions"
ADD COLUMN "previous_refresh_token_hash" TEXT;

ALTER TABLE "auth_sessions"
ADD COLUMN "rotated_at" DATETIME;

-- At most one short-lived idempotency result is kept for each session.
-- The payload is encrypted by the application and replaced on every rotation.
CREATE TABLE "auth_refresh_rotations" (
    "session_id" TEXT NOT NULL PRIMARY KEY,
    "previous_refresh_token_hash" TEXT NOT NULL,
    "encrypted_result" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_refresh_rotations_session_id_fkey"
      FOREIGN KEY ("session_id") REFERENCES "auth_sessions" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "auth_refresh_rotations_previous_refresh_token_hash_key"
ON "auth_refresh_rotations"("previous_refresh_token_hash");

CREATE INDEX "auth_refresh_rotations_expires_at_idx"
ON "auth_refresh_rotations"("expires_at");
