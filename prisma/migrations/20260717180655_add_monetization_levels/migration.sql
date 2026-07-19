-- CreateTable
CREATE TABLE "stu_monetization_levels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "routes" TEXT NOT NULL DEFAULT '[]',
    "rates" TEXT NOT NULL DEFAULT '[]',
    "meta_data" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "stu_monetization_level_translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "stu_monetization_level_translations_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "stu_monetization_levels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
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
    "level_id" INTEGER,
    "monetization_enabled" BOOLEAN NOT NULL DEFAULT false,
    "revenue" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "stu_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_file_id_fkey" FOREIGN KEY ("destination_file_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stu_links_destination_snippet_id_fkey" FOREIGN KEY ("destination_snippet_id") REFERENCES "Snippet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stu_links_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "stu_monetization_levels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Legacy level_id values did not reference a real table. Keep only values that
-- already match a migrated level; otherwise reset them to NULL safely.
INSERT INTO "new_stu_links" ("appearance", "clicks", "created_at", "deleted_at", "destination_file_id", "destination_snippet_id", "destination_type", "destination_url", "expires_at", "id", "level_id", "max_clicks", "revenue", "slug", "status", "subtitle", "title", "updated_at", "user_id")
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
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM "stu_monetization_levels" AS "level"
            WHERE "level"."id" = "stu_links"."level_id"
        ) THEN "level_id"
        ELSE NULL
    END,
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
CREATE INDEX "stu_links_level_id_idx" ON "stu_links"("level_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "stu_monetization_levels_key_key" ON "stu_monetization_levels"("key");

-- CreateIndex
CREATE INDEX "stu_monetization_levels_status_sort_order_idx" ON "stu_monetization_levels"("status", "sort_order");

-- CreateIndex
CREATE INDEX "stu_monetization_level_translations_locale_idx" ON "stu_monetization_level_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "stu_monetization_level_translations_level_id_locale_key" ON "stu_monetization_level_translations"("level_id", "locale");
