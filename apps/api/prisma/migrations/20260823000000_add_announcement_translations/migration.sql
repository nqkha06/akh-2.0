CREATE TABLE "announcement_translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "announcement_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "action_label" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "announcement_translations_announcement_id_fkey"
      FOREIGN KEY ("announcement_id") REFERENCES "announcements" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "announcement_translations_announcement_id_locale_key"
ON "announcement_translations"("announcement_id", "locale");

CREATE INDEX "announcement_translations_locale_idx"
ON "announcement_translations"("locale");

-- Preserve every existing announcement as a translation in the current default
-- locale. Legacy columns remain for migration compatibility; all new reads and
-- writes use this translation table.
INSERT INTO "announcement_translations" (
    "announcement_id", "locale", "title", "summary", "content", "action_label", "created_at", "updated_at"
)
SELECT
    "id",
    COALESCE((SELECT "locale" FROM "languages" WHERE "is_default" = true LIMIT 1), 'vi'),
    "title",
    "summary",
    "content",
    "action_label",
    "created_at",
    "updated_at"
FROM "announcements";
