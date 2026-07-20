PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "auth_refresh_rotations";

CREATE TABLE "new_auth_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "rotation_counter" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "auth_sessions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_auth_sessions" (
    "id",
    "user_id",
    "refresh_token_hash",
    "rotation_counter",
    "expires_at",
    "revoked_at",
    "user_agent",
    "ip_address",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "user_id",
    "refresh_token_hash",
    "rotation_counter",
    "expires_at",
    "revoked_at",
    "user_agent",
    "ip_address",
    "created_at",
    "updated_at"
FROM "auth_sessions";

DROP TABLE "auth_sessions";
ALTER TABLE "new_auth_sessions" RENAME TO "auth_sessions";

CREATE INDEX "auth_sessions_user_id_idx"
ON "auth_sessions"("user_id");

CREATE INDEX "auth_sessions_user_id_revoked_at_idx"
ON "auth_sessions"("user_id", "revoked_at");

CREATE INDEX "auth_sessions_expires_at_idx"
ON "auth_sessions"("expires_at");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
