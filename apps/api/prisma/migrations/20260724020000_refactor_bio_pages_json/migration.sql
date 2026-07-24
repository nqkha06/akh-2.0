PRAGMA foreign_keys=OFF;

CREATE TABLE "new_bio_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "content_json" TEXT NOT NULL DEFAULT '{"socialLinks":[],"customLinks":[],"widgets":[]}',
    "appearance_json" TEXT NOT NULL DEFAULT '{"buttonStyle":"rounded","backgroundColor":"#ffffff"}',
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "bio_pages_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_bio_pages" (
    "id",
    "user_id",
    "slug",
    "name",
    "title",
    "status",
    "content_json",
    "appearance_json",
    "views",
    "clicks",
    "published_at",
    "created_at",
    "updated_at",
    "deleted_at"
)
SELECT
    "id",
    CASE
      WHEN (SELECT COUNT(*) FROM "users") = 1
      THEN (SELECT "id" FROM "users" LIMIT 1)
      ELSE NULL
    END,
    "slug",
    "name",
    "title",
    CASE
      WHEN (SELECT COUNT(*) FROM "users") = 1 THEN "status"
      ELSE 'draft'
    END,
    json_object(
      'socialLinks', json("socialLinksJson"),
      'customLinks',
        (
          SELECT json_group_array(
            json_set(
              value,
              '$.isVisible',
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM json_each("BioPage"."hiddenLinksJson") AS hidden
                  WHERE hidden.value = json_extract(value, '$.id')
                )
                THEN json('false')
                ELSE json('true')
              END
            )
          )
          FROM json_each("BioPage"."customLinksJson")
        ),
      'widgets', json("widgetsJson")
    ),
    json_object(
      'buttonStyle', "buttonStyle",
      'backgroundColor', "backgroundColor",
      'backgroundImage', "backgroundImage",
      'backgroundMediaType', "backgroundMediaType",
      'backgroundMediaUrl', "backgroundMediaUrl",
      'selectedBackgroundId', "selectedBackgroundId"
    ),
    "views",
    "clicks",
    CASE WHEN "status" = 'published' THEN "updatedAt" ELSE NULL END,
    "createdAt",
    "updatedAt",
    NULL
FROM "BioPage";

DROP TABLE "BioPage";
ALTER TABLE "new_bio_pages" RENAME TO "bio_pages";

CREATE UNIQUE INDEX "bio_pages_slug_key" ON "bio_pages"("slug");
CREATE INDEX "bio_pages_user_id_status_deleted_at_idx"
  ON "bio_pages"("user_id", "status", "deleted_at");
CREATE INDEX "bio_pages_user_id_updated_at_idx"
  ON "bio_pages"("user_id", "updated_at");
CREATE INDEX "bio_pages_status_deleted_at_idx"
  ON "bio_pages"("status", "deleted_at");
CREATE INDEX "bio_pages_created_at_idx" ON "bio_pages"("created_at");

PRAGMA foreign_keys=ON;
