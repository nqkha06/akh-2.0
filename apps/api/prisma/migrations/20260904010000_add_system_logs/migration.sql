CREATE TABLE "system_log_categories" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL
);

CREATE TABLE "system_log_retention_settings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "scope" TEXT NOT NULL,
  "retention_days" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_by_id" INTEGER,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "system_log_retention_settings_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "system_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "level" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "context" TEXT,
  "event" TEXT,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "user_id" INTEGER,
  "admin_id" INTEGER,
  "request_id" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "stack" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "system_logs_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "system_log_categories_key_key"
ON "system_log_categories"("key");
CREATE INDEX "system_log_categories_is_active_sort_order_idx"
ON "system_log_categories"("is_active", "sort_order");

CREATE UNIQUE INDEX "system_log_retention_settings_scope_key"
ON "system_log_retention_settings"("scope");
CREATE INDEX "system_log_retention_settings_updated_by_id_idx"
ON "system_log_retention_settings"("updated_by_id");

CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");
CREATE INDEX "system_logs_level_created_at_idx" ON "system_logs"("level", "created_at");
CREATE INDEX "system_logs_category_created_at_idx" ON "system_logs"("category", "created_at");
CREATE INDEX "system_logs_context_created_at_idx" ON "system_logs"("context", "created_at");
CREATE INDEX "system_logs_event_created_at_idx" ON "system_logs"("event", "created_at");
CREATE INDEX "system_logs_request_id_idx" ON "system_logs"("request_id");
CREATE INDEX "system_logs_user_id_created_at_idx" ON "system_logs"("user_id", "created_at");
CREATE INDEX "system_logs_admin_id_created_at_idx" ON "system_logs"("admin_id", "created_at");

INSERT INTO "system_log_categories"
  ("key", "name", "description", "is_active", "sort_order", "created_at", "updated_at")
VALUES
  ('SYSTEM', 'System', 'Lifecycle và vận hành lõi của hệ thống.', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('HTTP', 'HTTP', 'Sự kiện ở lớp HTTP và request pipeline.', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('AUTH', 'Authentication', 'Đăng nhập, phiên và xác thực.', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ADMIN', 'Admin', 'Thao tác vận hành của quản trị viên.', true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('QUEUE', 'Queue', 'Producer, worker và trạng thái job.', true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CRON', 'Cron', 'Scheduled jobs và cleanup.', true, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DATABASE', 'Database', 'Kết nối và lỗi persistence.', true, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('API', 'API', 'Tích hợp và hành vi API ứng dụng.', true, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('INTEGRATION', 'Integration', 'Dịch vụ bên thứ ba.', true, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SECURITY', 'Security', 'Sự kiện bảo mật cần lưu giữ dài hạn.', true, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BUSINESS', 'Business', 'Sự kiện nghiệp vụ quan trọng.', true, 110, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ERROR', 'Error', 'Exception và lỗi hệ thống quan trọng.', true, 120, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "system_log_retention_settings"
  ("scope", "retention_days", "enabled", "created_at", "updated_at")
VALUES
  ('GLOBAL', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CATEGORY:HTTP', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LEVEL:DEBUG', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CATEGORY:SYSTEM', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CATEGORY:ERROR', 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CATEGORY:SECURITY', 180, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "permissions"
  ("key", "name", "description", "group", "created_at", "updated_at")
VALUES
  ('system_logs.view', 'Xem system logs', 'Xem danh sách, thống kê và chi tiết system log.', 'system-logs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system_logs.delete', 'Xóa system logs', 'Xóa một hoặc nhiều system log và thực hiện cleanup thủ công.', 'system-logs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system_logs.manage_settings', 'Quản lý system log', 'Quản lý category và chính sách retention của system log.', 'system-logs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id", "created_at")
SELECT "roles"."id", "permissions"."id", CURRENT_TIMESTAMP
FROM "roles"
JOIN "permissions" ON "permissions"."key" IN (
  'system_logs.view',
  'system_logs.delete',
  'system_logs.manage_settings'
)
WHERE "roles"."key" = 'admin';
