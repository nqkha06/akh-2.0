PRAGMA foreign_keys=OFF;

-- Existing prototype links did not have an owner. Assign them to the oldest
-- account so the migration preserves local data and all new writes are owned.
INSERT INTO "users" (
    "name",
    "email",
    "email_verified_at",
    "password",
    "avatar",
    "status",
    "role",
    "token_version",
    "created_at",
    "updated_at"
)
SELECT
    'Legacy Link Owner',
    'legacy-links@local.invalid',
    CURRENT_TIMESTAMP,
    NULL,
    NULL,
    'active',
    'member',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "Link")
  AND NOT EXISTS (SELECT 1 FROM "users");

CREATE TABLE "stu_links" (
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
        FOREIGN KEY ("destination_snippet_id") REFERENCES "Snippet" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "stu_links" (
    "user_id",
    "slug",
    "title",
    "subtitle",
    "destination_type",
    "destination_url",
    "destination_file_id",
    "destination_snippet_id",
    "appearance",
    "expires_at",
    "max_clicks",
    "clicks",
    "status",
    "level_id",
    "revenue",
    "created_at",
    "updated_at",
    "deleted_at"
)
SELECT
    (SELECT "id" FROM "users" ORDER BY "id" LIMIT 1),
    old."slug",
    old."title",
    old."subtitle",
    CASE
        WHEN old."inputType" IN ('url', 'file', 'snippet') THEN old."inputType"
        ELSE 'url'
    END,
    CASE
        WHEN old."inputType" = 'snippet'
             AND EXISTS (
                 SELECT 1 FROM "Snippet" snippet
                 WHERE snippet."id" = old."selectedSnippet"
             )
            THEN NULL
        ELSE old."destinationUrl"
    END,
    CASE
        WHEN old."inputType" = 'file'
             AND EXISTS (
                 SELECT 1 FROM "ManagedFile" file
                 WHERE file."id" = old."selectedFile"
             )
            THEN old."selectedFile"
        ELSE NULL
    END,
    CASE
        WHEN old."inputType" = 'snippet'
             AND EXISTS (
                 SELECT 1 FROM "Snippet" snippet
                 WHERE snippet."id" = old."selectedSnippet"
             )
            THEN old."selectedSnippet"
        ELSE NULL
    END,
    json_object(
        'coverImageUrl', old."coverImageUrl",
        'backgroundSettings', json_object(
            'selectedBackgroundId', old."selectedBackgroundId",
            'selectedBackgroundName', old."selectedBackgroundName",
            'backgroundMediaType', old."backgroundMediaType",
            'backgroundMediaUrl', old."backgroundMediaUrl",
            'sameAsCoverImage', old."sameAsCoverImage",
            'effects', json_object(
                'opacity', old."opacity",
                'blur', old."blur",
                'saturation', old."saturation",
                'contrast', old."contrast",
                'grayscale', old."grayscale"
            )
        )
    ),
    CASE
        WHEN old."expiryEnabled" = 1 AND old."expiryType" = 'date'
            THEN old."expiryDate"
        ELSE NULL
    END,
    CASE
        WHEN old."expiryEnabled" = 1 AND old."expiryType" = 'clicks'
            THEN old."maxClicks"
        ELSE NULL
    END,
    old."clicks",
    old."status",
    NULL,
    0,
    old."createdAt",
    old."updatedAt",
    NULL
FROM "Link" old;

CREATE TABLE "stu_link_actions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "link_id" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stu_link_actions_link_id_fkey"
        FOREIGN KEY ("link_id") REFERENCES "stu_links" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "stu_link_actions" (
    "link_id",
    "platform",
    "action",
    "url",
    "position",
    "created_at",
    "updated_at"
)
SELECT
    migrated_link."id",
    old_action."platform",
    old_action."action",
    old_action."url",
    ROW_NUMBER() OVER (
        PARTITION BY old_action."linkId"
        ORDER BY old_action."createdAt", old_action."id"
    ) - 1,
    old_action."createdAt",
    old_action."createdAt"
FROM "LinkAction" old_action
JOIN "Link" old_link ON old_link."id" = old_action."linkId"
JOIN "stu_links" migrated_link ON migrated_link."slug" = old_link."slug";

DROP TABLE "LinkAction";
DROP TABLE "Link";

CREATE UNIQUE INDEX "stu_links_slug_key" ON "stu_links"("slug");
CREATE INDEX "stu_links_user_id_idx" ON "stu_links"("user_id");
CREATE INDEX "stu_links_user_id_status_idx" ON "stu_links"("user_id", "status");
CREATE INDEX "stu_links_created_at_idx" ON "stu_links"("created_at");
CREATE INDEX "stu_links_deleted_at_idx" ON "stu_links"("deleted_at");
CREATE INDEX "stu_link_actions_link_id_position_idx"
    ON "stu_link_actions"("link_id", "position");

PRAGMA foreign_keys=ON;
