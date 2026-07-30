CREATE TABLE "announcements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "display_type" TEXT NOT NULL DEFAULT 'notification',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "target_type" TEXT NOT NULL DEFAULT 'all',
    "target_rules" TEXT NOT NULL DEFAULT '{}',
    "action_label" TEXT,
    "action_url" TEXT,
    "is_dismissible" BOOLEAN NOT NULL DEFAULT true,
    "requires_acknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "starts_at" DATETIME,
    "ends_at" DATETIME,
    "published_at" DATETIME,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "announcements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "announcement_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "announcement_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "seen_at" DATETIME,
    "read_at" DATETIME,
    "dismissed_at" DATETIME,
    "acknowledged_at" DATETIME,
    "cta_clicked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "announcement_users_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "announcement_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "announcements_slug_key" ON "announcements"("slug");
CREATE INDEX "announcements_status_starts_at_ends_at_idx" ON "announcements"("status", "starts_at", "ends_at");
CREATE INDEX "announcements_display_type_status_idx" ON "announcements"("display_type", "status");
CREATE INDEX "announcements_priority_created_at_idx" ON "announcements"("priority", "created_at");
CREATE INDEX "announcements_target_type_idx" ON "announcements"("target_type");
CREATE INDEX "announcements_deleted_at_idx" ON "announcements"("deleted_at");
CREATE UNIQUE INDEX "announcement_users_announcement_id_user_id_key" ON "announcement_users"("announcement_id", "user_id");
CREATE INDEX "announcement_users_user_id_read_at_idx" ON "announcement_users"("user_id", "read_at");
CREATE INDEX "announcement_users_user_id_dismissed_at_idx" ON "announcement_users"("user_id", "dismissed_at");
CREATE INDEX "announcement_users_announcement_id_seen_at_idx" ON "announcement_users"("announcement_id", "seen_at");

INSERT OR IGNORE INTO "permissions" ("key", "name", "description", "group", "created_at", "updated_at")
VALUES
  ('announcements.view', 'Xem thông báo hệ thống', 'Xem danh sách, chi tiết và analytics thông báo.', 'announcements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('announcements.create', 'Tạo thông báo hệ thống', 'Tạo và nhân bản thông báo hệ thống.', 'announcements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('announcements.update', 'Sửa thông báo hệ thống', 'Cập nhật hoặc tạm dừng thông báo.', 'announcements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('announcements.delete', 'Xóa thông báo hệ thống', 'Xóa mềm thông báo khỏi hệ thống.', 'announcements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('announcements.publish', 'Phát hành thông báo hệ thống', 'Xuất bản thông báo tới member.', 'announcements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id", "created_at")
SELECT "roles"."id", "permissions"."id", CURRENT_TIMESTAMP
FROM "roles"
JOIN "permissions" ON "permissions"."key" IN ('announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete', 'announcements.publish')
WHERE "roles"."key" = 'admin';
