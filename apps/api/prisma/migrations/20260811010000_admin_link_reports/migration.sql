ALTER TABLE "link_reports" ADD COLUMN "resolution_note" TEXT;
ALTER TABLE "link_reports" ADD COLUMN "reviewed_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "link_reports" ADD COLUMN "resolved_at" DATETIME;
ALTER TABLE "link_reports" ADD COLUMN "deleted_at" DATETIME;

CREATE INDEX "link_reports_reviewed_by_id_status_idx" ON "link_reports"("reviewed_by_id", "status");
CREATE INDEX "link_reports_deleted_at_idx" ON "link_reports"("deleted_at");

INSERT OR IGNORE INTO "permissions" ("key", "name", "description", "group", "created_at", "updated_at")
VALUES
  ('link-reports.read', 'Xem báo cáo liên kết', 'Xem danh sách và chi tiết báo cáo liên kết từ người dùng.', 'moderation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('link-reports.manage', 'Xử lý báo cáo liên kết', 'Cập nhật trạng thái và kết luận kiểm duyệt báo cáo liên kết.', 'moderation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('link-reports.delete', 'Xóa báo cáo liên kết', 'Xóa mềm báo cáo liên kết khỏi hàng đợi quản trị.', 'moderation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id", "created_at")
SELECT "roles"."id", "permissions"."id", CURRENT_TIMESTAMP
FROM "roles"
JOIN "permissions" ON "permissions"."key" IN ('link-reports.read', 'link-reports.manage', 'link-reports.delete')
WHERE "roles"."key" = 'admin';
