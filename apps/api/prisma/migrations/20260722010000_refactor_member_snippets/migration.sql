-- Snippets used to be global records in the legacy "Snippet" table. This
-- migration gives every snippet an owner, converts the table/columns to the
-- project's snake_case convention, and snapshots snippet content on links so
-- deleting or editing a library item cannot break an already published link.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- A database created before authentication could contain orphan snippets.
-- Give those rows a deterministic local migration owner rather than dropping
-- user content silently.
INSERT INTO "users" (
    "name",
    "email",
    "email_verified_at",
    "password",
    "avatar",
    "status",
    "balance",
    "token_version",
    "created_at",
    "updated_at"
)
SELECT
    'Legacy Snippet Owner',
    'legacy-snippets@local.invalid',
    CURRENT_TIMESTAMP,
    NULL,
    NULL,
    'active',
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "Snippet")
  AND NOT EXISTS (SELECT 1 FROM "users");

CREATE TABLE "snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "snippets_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- One legacy snippet may have been referenced by links belonging to different
-- users. Keep the original ID for the lowest owner ID and clone the record for
-- every additional owner.
INSERT INTO "snippets" (
    "id", "user_id", "name", "content", "created_at", "updated_at", "deleted_at"
)
SELECT
    CASE
      WHEN ownership."user_id" = (
        SELECT MIN(link_owner."user_id")
        FROM "stu_links" AS link_owner
        WHERE link_owner."destination_snippet_id" = legacy."id"
      ) THEN legacy."id"
      ELSE legacy."id" || '__owner_' || ownership."user_id"
    END,
    ownership."user_id",
    legacy."name",
    legacy."content",
    legacy."createdAt",
    legacy."updatedAt",
    NULL
FROM "Snippet" AS legacy
JOIN (
    SELECT DISTINCT "destination_snippet_id", "user_id"
    FROM "stu_links"
    WHERE "destination_snippet_id" IS NOT NULL
) AS ownership
  ON ownership."destination_snippet_id" = legacy."id";

-- Snippets that are not referenced by a link have no historical ownership
-- signal. Preserve them under the oldest account for manual reassignment.
INSERT INTO "snippets" (
    "id", "user_id", "name", "content", "created_at", "updated_at", "deleted_at"
)
SELECT
    legacy."id",
    (SELECT "id" FROM "users" ORDER BY "id" LIMIT 1),
    legacy."name",
    legacy."content",
    legacy."createdAt",
    legacy."updatedAt",
    NULL
FROM "Snippet" AS legacy
WHERE NOT EXISTS (
    SELECT 1
    FROM "stu_links" AS link
    WHERE link."destination_snippet_id" = legacy."id"
);

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
    "destination_snippet_content" TEXT,
    "appearance" TEXT NOT NULL DEFAULT '{}',
    "expires_at" DATETIME,
    "max_clicks" INTEGER,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "stu_links_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_file_id_fkey"
      FOREIGN KEY ("destination_file_id") REFERENCES "ManagedFile" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_snippet_id_fkey"
      FOREIGN KEY ("destination_snippet_id") REFERENCES "snippets" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_stu_links" (
    "id",
    "user_id",
    "slug",
    "title",
    "subtitle",
    "destination_type",
    "destination_url",
    "destination_file_id",
    "destination_snippet_id",
    "destination_snippet_content",
    "appearance",
    "expires_at",
    "max_clicks",
    "clicks",
    "status",
    "revenue",
    "created_at",
    "updated_at",
    "deleted_at"
)
SELECT
    link."id",
    link."user_id",
    link."slug",
    link."title",
    link."subtitle",
    link."destination_type",
    CASE
      WHEN link."destination_type" = 'snippet' THEN NULL
      ELSE link."destination_url"
    END,
    link."destination_file_id",
    CASE
      WHEN legacy."id" IS NULL THEN NULL
      WHEN link."user_id" = (
        SELECT MIN(link_owner."user_id")
        FROM "stu_links" AS link_owner
        WHERE link_owner."destination_snippet_id" = legacy."id"
      ) THEN legacy."id"
      ELSE legacy."id" || '__owner_' || link."user_id"
    END,
    CASE
      WHEN link."destination_type" = 'snippet'
        THEN COALESCE(legacy."content", link."destination_url")
      ELSE NULL
    END,
    link."appearance",
    link."expires_at",
    link."max_clicks",
    link."clicks",
    link."status",
    link."revenue",
    link."created_at",
    link."updated_at",
    link."deleted_at"
FROM "stu_links" AS link
LEFT JOIN "Snippet" AS legacy
  ON legacy."id" = link."destination_snippet_id";

DROP TABLE "stu_links";
ALTER TABLE "new_stu_links" RENAME TO "stu_links";
DROP TABLE "Snippet";

CREATE UNIQUE INDEX "stu_links_slug_key" ON "stu_links"("slug");
CREATE INDEX "stu_links_user_id_idx" ON "stu_links"("user_id");
CREATE INDEX "stu_links_user_id_status_idx" ON "stu_links"("user_id", "status");
CREATE INDEX "stu_links_created_at_idx" ON "stu_links"("created_at");
CREATE INDEX "stu_links_deleted_at_idx" ON "stu_links"("deleted_at");

CREATE INDEX "snippets_user_id_deleted_at_created_at_idx"
  ON "snippets"("user_id", "deleted_at", "created_at");
CREATE INDEX "snippets_user_id_name_idx"
  ON "snippets"("user_id", "name");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
