PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "admin_media_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "parent_id" TEXT,
    "parent_scope" TEXT NOT NULL,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "admin_media_folders_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "admin_media_folders" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "admin_media_folders_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "admin_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folder_id" TEXT,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "caption" TEXT,
    "uploaded_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "admin_media_folder_id_fkey"
      FOREIGN KEY ("folder_id") REFERENCES "admin_media_folders" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "admin_media_uploaded_by_fkey"
      FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "admin_media_folders_parent_scope_normalized_name_key"
  ON "admin_media_folders"("parent_scope", "normalized_name");
CREATE INDEX "admin_media_folders_parent_id_idx"
  ON "admin_media_folders"("parent_id");
CREATE INDEX "admin_media_folders_deleted_at_idx"
  ON "admin_media_folders"("deleted_at");
CREATE INDEX "admin_media_folders_created_by_idx"
  ON "admin_media_folders"("created_by");

CREATE UNIQUE INDEX "admin_media_storage_key_key"
  ON "admin_media"("storage_key");
CREATE INDEX "admin_media_folder_id_idx" ON "admin_media"("folder_id");
CREATE INDEX "admin_media_created_at_idx" ON "admin_media"("created_at");
CREATE INDEX "admin_media_mime_type_idx" ON "admin_media"("mime_type");
CREATE INDEX "admin_media_deleted_at_idx" ON "admin_media"("deleted_at");
CREATE INDEX "admin_media_uploaded_by_idx" ON "admin_media"("uploaded_by");

CREATE TABLE "new_website_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "site_name" TEXT NOT NULL DEFAULT 'Linkicom',
    "site_short_name" TEXT,
    "site_description" TEXT,
    "site_tagline" TEXT,
    "site_url" TEXT,
    "logo_light_id" TEXT,
    "logo_dark_id" TEXT,
    "logo_icon_id" TEXT,
    "favicon_id" TEXT,
    "default_og_image_id" TEXT,
    "social_links" TEXT NOT NULL DEFAULT '[]',
    "contact_email" TEXT,
    "support_email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "working_hours" TEXT,
    "map_url" TEXT,
    "updated_by_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "website_settings_logo_light_id_fkey" FOREIGN KEY ("logo_light_id") REFERENCES "admin_media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_logo_dark_id_fkey" FOREIGN KEY ("logo_dark_id") REFERENCES "admin_media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_logo_icon_id_fkey" FOREIGN KEY ("logo_icon_id") REFERENCES "admin_media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_favicon_id_fkey" FOREIGN KEY ("favicon_id") REFERENCES "admin_media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_default_og_image_id_fkey" FOREIGN KEY ("default_og_image_id") REFERENCES "admin_media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_website_settings" (
    "id", "site_name", "site_short_name", "site_description", "site_tagline",
    "site_url", "logo_light_id", "logo_dark_id", "logo_icon_id", "favicon_id",
    "default_og_image_id", "social_links", "contact_email", "support_email",
    "phone", "address", "working_hours", "map_url", "updated_by_id",
    "created_at", "updated_at"
)
SELECT
    "id", "site_name", "site_short_name", "site_description", "site_tagline",
    "site_url", NULL, NULL, NULL, NULL, NULL, "social_links",
    "contact_email", "support_email", "phone", "address", "working_hours",
    "map_url", "updated_by_id", "created_at", "updated_at"
FROM "website_settings";

DROP TABLE "website_settings";
ALTER TABLE "new_website_settings" RENAME TO "website_settings";
CREATE INDEX "website_settings_logo_light_id_idx" ON "website_settings"("logo_light_id");
CREATE INDEX "website_settings_logo_dark_id_idx" ON "website_settings"("logo_dark_id");
CREATE INDEX "website_settings_logo_icon_id_idx" ON "website_settings"("logo_icon_id");
CREATE INDEX "website_settings_favicon_id_idx" ON "website_settings"("favicon_id");
CREATE INDEX "website_settings_default_og_image_id_idx" ON "website_settings"("default_og_image_id");
CREATE INDEX "website_settings_updated_by_id_idx" ON "website_settings"("updated_by_id");

CREATE TABLE "new_pages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content_json" TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    "content_html" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured_image_id" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "canonical_url" TEXT,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "pages_featured_image_id_fkey"
      FOREIGN KEY ("featured_image_id") REFERENCES "admin_media" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_pages" (
    "id", "title", "slug", "excerpt", "content_json", "content_html",
    "status", "featured_image_id", "seo_title", "seo_description",
    "seo_keywords", "canonical_url", "robots_index", "robots_follow",
    "sort_order", "published_at", "created_at", "updated_at", "deleted_at"
)
SELECT
    "id", "title", "slug", "excerpt", "content_json", "content_html",
    "status", NULL, "seo_title", "seo_description", "seo_keywords",
    "canonical_url", "robots_index", "robots_follow", "sort_order",
    "published_at", "created_at", "updated_at", "deleted_at"
FROM "pages";

DROP TABLE "pages";
ALTER TABLE "new_pages" RENAME TO "pages";
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");
CREATE INDEX "pages_status_sort_order_idx" ON "pages"("status", "sort_order");
CREATE INDEX "pages_created_at_idx" ON "pages"("created_at");
CREATE INDEX "pages_updated_at_idx" ON "pages"("updated_at");
CREATE INDEX "pages_published_at_idx" ON "pages"("published_at");
CREATE INDEX "pages_deleted_at_idx" ON "pages"("deleted_at");
CREATE INDEX "pages_featured_image_id_idx" ON "pages"("featured_image_id");

INSERT OR IGNORE INTO "permissions" (
    "key", "name", "description", "group", "created_at", "updated_at"
) VALUES
    ('admin-media.read', 'Xem thư viện Media Admin', 'Xem file và thư mục thuộc thư viện Media Admin.', 'admin-media', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('admin-media.upload', 'Tải Media Admin', 'Tải ảnh mới lên thư viện Media Admin.', 'admin-media', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('admin-media.update', 'Sửa Media Admin', 'Cập nhật metadata và vị trí file Media Admin.', 'admin-media', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('admin-media.delete', 'Xóa Media Admin', 'Xóa file không còn được sử dụng khỏi Media Admin.', 'admin-media', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('admin-media.manage-folders', 'Quản lý thư mục Media Admin', 'Tạo, đổi tên, di chuyển và xóa thư mục Media Admin.', 'admin-media', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id")
SELECT role."id", permission."id"
FROM "roles" role
CROSS JOIN "permissions" permission
WHERE role."key" = 'admin'
  AND permission."key" LIKE 'admin-media.%';

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
