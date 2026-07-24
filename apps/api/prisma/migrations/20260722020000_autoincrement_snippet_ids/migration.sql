-- Convert legacy text snippet IDs to SQLite INTEGER PRIMARY KEY AUTOINCREMENT.
-- The temporary map keeps every link relation intact during the table rebuild.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "snippet_id_map" (
    "new_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "old_id" TEXT NOT NULL UNIQUE
);

INSERT INTO "snippet_id_map" ("old_id")
SELECT "id"
FROM "snippets"
ORDER BY "created_at" ASC, "id" ASC;

CREATE TABLE "new_snippets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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

INSERT INTO "new_snippets" (
    "id", "user_id", "name", "content", "created_at", "updated_at", "deleted_at"
)
SELECT
    id_map."new_id",
    snippet."user_id",
    snippet."name",
    snippet."content",
    snippet."created_at",
    snippet."updated_at",
    snippet."deleted_at"
FROM "snippets" AS snippet
JOIN "snippet_id_map" AS id_map
  ON id_map."old_id" = snippet."id";

CREATE TABLE "new_stu_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "destination_type" TEXT NOT NULL DEFAULT 'url',
    "destination_url" TEXT,
    "destination_file_id" TEXT,
    "destination_snippet_id" INTEGER,
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
    link."destination_url",
    link."destination_file_id",
    id_map."new_id",
    link."destination_snippet_content",
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
LEFT JOIN "snippet_id_map" AS id_map
  ON id_map."old_id" = link."destination_snippet_id";

DROP TABLE "stu_links";
DROP TABLE "snippets";
ALTER TABLE "new_snippets" RENAME TO "snippets";
ALTER TABLE "new_stu_links" RENAME TO "stu_links";
DROP TABLE "snippet_id_map";

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
