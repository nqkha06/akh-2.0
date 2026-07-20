-- Add the account-level monetization selection. Existing accounts inherit the
-- most recently updated enabled link level; NULL continues to mean that the
-- active system default should be used.
ALTER TABLE "users"
ADD COLUMN "monetization_level_id" INTEGER
REFERENCES "stu_monetization_levels"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

UPDATE "users"
SET "monetization_level_id" = (
    SELECT "link"."level_id"
    FROM "stu_links" AS "link"
    WHERE "link"."user_id" = "users"."id"
      AND "link"."level_id" IS NOT NULL
    ORDER BY "link"."monetization_enabled" DESC,
             "link"."updated_at" DESC,
             "link"."id" DESC
    LIMIT 1
);

CREATE INDEX "users_monetization_level_id_idx"
ON "users"("monetization_level_id");

-- Level selection no longer belongs to individual links.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_stu_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "destination_type" TEXT NOT NULL DEFAULT 'url',
    "destination_url" TEXT,
    "destination_file_id" TEXT,
    "destination_snippet_id" TEXT,
    "appearance" TEXT NOT NULL DEFAULT '{}',
    "expires_at" DATETIME,
    "max_clicks" INTEGER,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "stu_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_file_id_fkey" FOREIGN KEY ("destination_file_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_snippet_id_fkey" FOREIGN KEY ("destination_snippet_id") REFERENCES "Snippet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_stu_links" (
    "appearance",
    "clicks",
    "created_at",
    "deleted_at",
    "destination_file_id",
    "destination_snippet_id",
    "destination_type",
    "destination_url",
    "expires_at",
    "id",
    "max_clicks",
    "revenue",
    "slug",
    "status",
    "subtitle",
    "title",
    "updated_at",
    "user_id"
)
SELECT
    "appearance",
    "clicks",
    "created_at",
    "deleted_at",
    "destination_file_id",
    "destination_snippet_id",
    "destination_type",
    "destination_url",
    "expires_at",
    "id",
    "max_clicks",
    "revenue",
    "slug",
    "status",
    "subtitle",
    "title",
    "updated_at",
    "user_id"
FROM "stu_links";

DROP TABLE "stu_links";
ALTER TABLE "new_stu_links" RENAME TO "stu_links";

CREATE UNIQUE INDEX "stu_links_slug_key" ON "stu_links"("slug");
CREATE INDEX "stu_links_user_id_idx" ON "stu_links"("user_id");
CREATE INDEX "stu_links_user_id_status_idx" ON "stu_links"("user_id", "status");
CREATE INDEX "stu_links_created_at_idx" ON "stu_links"("created_at");
CREATE INDEX "stu_links_deleted_at_idx" ON "stu_links"("deleted_at");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
