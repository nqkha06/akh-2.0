-- Replace the global legacy ManagedFile table with owner-scoped member files.
-- Legacy files referenced by links are assigned to each link owner. Files with
-- no ownership signal are preserved under the oldest account.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

ALTER TABLE "users" ADD COLUMN "storage_limit_bytes" BIGINT;
ALTER TABLE "users" ADD COLUMN "storage_used_bytes" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "storage_reserved_bytes" BIGINT NOT NULL DEFAULT 0;

INSERT INTO "users" (
    "name", "email", "email_verified_at", "password", "avatar", "status",
    "balance", "token_version", "created_at", "updated_at"
)
SELECT
    'Legacy File Owner',
    'legacy-files@local.invalid',
    CURRENT_TIMESTAMP,
    NULL,
    NULL,
    'active',
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "ManagedFile")
  AND NOT EXISTS (SELECT 1 FROM "users");

CREATE TABLE "member_file_id_map" (
    "new_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "old_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    UNIQUE("old_id", "user_id")
);

INSERT INTO "member_file_id_map" ("old_id", "user_id")
SELECT DISTINCT file."id", link."user_id"
FROM "ManagedFile" AS file
JOIN "stu_links" AS link
  ON link."destination_file_id" = file."id";

INSERT INTO "member_file_id_map" ("old_id", "user_id")
SELECT file."id", (SELECT MIN("id") FROM "users")
FROM "ManagedFile" AS file
WHERE NOT EXISTS (
    SELECT 1
    FROM "member_file_id_map" AS owned
    WHERE owned."old_id" = file."id"
);

CREATE TABLE "member_files" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "extension" TEXT,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'file',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "member_files_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "member_files" (
    "id", "user_id", "alias", "name", "original_name", "extension",
    "mime_type", "size", "storage_key", "purpose", "is_public",
    "download_count", "status", "created_at", "updated_at", "deleted_at"
)
SELECT
    id_map."new_id",
    id_map."user_id",
    file."alias",
    file."name",
    file."originalName",
    file."extension",
    file."mimeType",
    file."size",
    file."path",
    'file',
    file."isPublic",
    file."downloadCount",
    file."status",
    file."createdAt",
    file."updatedAt",
    file."deletedAt"
FROM "ManagedFile" AS file
JOIN "member_file_id_map" AS id_map
  ON id_map."old_id" = file."id";

CREATE TABLE "member_file_uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'file',
    "storage_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "member_file_uploads_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "new_stu_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "destination_type" TEXT NOT NULL DEFAULT 'url',
    "destination_url" TEXT,
    "destination_file_id" INTEGER,
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
      FOREIGN KEY ("destination_file_id") REFERENCES "member_files" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_snippet_id_fkey"
      FOREIGN KEY ("destination_snippet_id") REFERENCES "snippets" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_stu_links" (
    "id", "user_id", "slug", "title", "subtitle", "destination_type",
    "destination_url", "destination_file_id", "destination_snippet_id",
    "destination_snippet_content", "appearance", "expires_at", "max_clicks",
    "clicks", "status", "revenue", "created_at", "updated_at", "deleted_at"
)
SELECT
    link."id",
    link."user_id",
    link."slug",
    link."title",
    link."subtitle",
    link."destination_type",
    link."destination_url",
    file_map."new_id",
    link."destination_snippet_id",
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
LEFT JOIN "member_file_id_map" AS file_map
  ON file_map."old_id" = link."destination_file_id"
 AND file_map."user_id" = link."user_id";

DROP TABLE "stu_links";
DROP TABLE "ManagedFile";
ALTER TABLE "new_stu_links" RENAME TO "stu_links";
DROP TABLE "member_file_id_map";

CREATE UNIQUE INDEX "member_files_user_id_alias_key"
  ON "member_files"("user_id", "alias");
CREATE INDEX "member_files_user_id_deleted_at_created_at_idx"
  ON "member_files"("user_id", "deleted_at", "created_at");
CREATE INDEX "member_files_user_id_mime_type_idx"
  ON "member_files"("user_id", "mime_type");
CREATE INDEX "member_files_user_id_status_idx"
  ON "member_files"("user_id", "status");
CREATE INDEX "member_files_storage_key_idx"
  ON "member_files"("storage_key");
CREATE INDEX "member_file_uploads_user_id_status_idx"
  ON "member_file_uploads"("user_id", "status");
CREATE INDEX "member_file_uploads_expires_at_idx"
  ON "member_file_uploads"("expires_at");

CREATE UNIQUE INDEX "stu_links_slug_key" ON "stu_links"("slug");
CREATE INDEX "stu_links_user_id_idx" ON "stu_links"("user_id");
CREATE INDEX "stu_links_user_id_status_idx" ON "stu_links"("user_id", "status");
CREATE INDEX "stu_links_created_at_idx" ON "stu_links"("created_at");
CREATE INDEX "stu_links_deleted_at_idx" ON "stu_links"("deleted_at");

UPDATE "users"
SET "storage_used_bytes" = COALESCE((
    SELECT SUM(file."size")
    FROM "member_files" AS file
    WHERE file."user_id" = "users"."id"
), 0);

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
