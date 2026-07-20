CREATE TABLE "website_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
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
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "website_settings_logo_light_id_fkey" FOREIGN KEY ("logo_light_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_logo_dark_id_fkey" FOREIGN KEY ("logo_dark_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_logo_icon_id_fkey" FOREIGN KEY ("logo_icon_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_favicon_id_fkey" FOREIGN KEY ("favicon_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_default_og_image_id_fkey" FOREIGN KEY ("default_og_image_id") REFERENCES "ManagedFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "website_settings_logo_light_id_idx" ON "website_settings"("logo_light_id");
CREATE INDEX "website_settings_logo_dark_id_idx" ON "website_settings"("logo_dark_id");
CREATE INDEX "website_settings_logo_icon_id_idx" ON "website_settings"("logo_icon_id");
CREATE INDEX "website_settings_favicon_id_idx" ON "website_settings"("favicon_id");
CREATE INDEX "website_settings_default_og_image_id_idx" ON "website_settings"("default_og_image_id");
CREATE INDEX "website_settings_updated_by_id_idx" ON "website_settings"("updated_by_id");

INSERT INTO "website_settings" (
    "id", "site_name", "site_description", "site_tagline", "social_links",
    "created_at", "updated_at"
) VALUES (
    1,
    'Linkicom',
    'Create link-in-bio pages, verified social unlocks and protected content experiences that turn creator traffic into real growth.',
    'One link. More momentum.',
    '[]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO "permissions" (
    "key", "name", "description", "group", "created_at", "updated_at"
) VALUES
    ('settings.read', 'Xem cài đặt website', 'Xem thông tin, nhận diện và liên hệ của website.', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('settings.update', 'Sửa cài đặt website', 'Cập nhật thông tin, nhận diện và liên hệ của website.', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id")
SELECT role."id", permission."id"
FROM "roles" role
CROSS JOIN "permissions" permission
WHERE role."key" = 'admin'
  AND permission."key" IN ('settings.read', 'settings.update');
