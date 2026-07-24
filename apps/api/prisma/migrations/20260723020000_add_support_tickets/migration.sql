CREATE TABLE "support_tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assigned_to_id" INTEGER,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "related_resource" TEXT,
    "technical_info" TEXT,
    "last_message_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    "closed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "support_ticket_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket_id" INTEGER NOT NULL,
    "author_id" INTEGER,
    "author_role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" DATETIME,
    "deleted_at" DATETIME,
    CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "support_ticket_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "support_ticket_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" INTEGER NOT NULL,
    "message_id" INTEGER,
    "uploaded_by_id" INTEGER,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "support_ticket_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "support_ticket_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "support_ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "support_tickets_reference_key" ON "support_tickets"("reference");
CREATE INDEX "support_tickets_user_id_deleted_at_last_message_at_idx" ON "support_tickets"("user_id", "deleted_at", "last_message_at");
CREATE INDEX "support_tickets_status_priority_last_message_at_idx" ON "support_tickets"("status", "priority", "last_message_at");
CREATE INDEX "support_tickets_assigned_to_id_status_idx" ON "support_tickets"("assigned_to_id", "status");
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");
CREATE INDEX "support_ticket_messages_ticket_id_created_at_idx" ON "support_ticket_messages"("ticket_id", "created_at");
CREATE INDEX "support_ticket_messages_author_id_idx" ON "support_ticket_messages"("author_id");
CREATE UNIQUE INDEX "support_ticket_attachments_storage_key_key" ON "support_ticket_attachments"("storage_key");
CREATE INDEX "support_ticket_attachments_ticket_id_idx" ON "support_ticket_attachments"("ticket_id");
CREATE INDEX "support_ticket_attachments_message_id_idx" ON "support_ticket_attachments"("message_id");
CREATE INDEX "support_ticket_attachments_uploaded_by_id_idx" ON "support_ticket_attachments"("uploaded_by_id");

INSERT OR IGNORE INTO "permissions" ("key", "name", "description", "group", "created_at", "updated_at")
VALUES
  ('support.read', 'Xem ticket hỗ trợ', 'Xem danh sách và nội dung ticket hỗ trợ của thành viên.', 'support', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support.reply', 'Phản hồi ticket hỗ trợ', 'Gửi phản hồi tới thành viên trong ticket hỗ trợ.', 'support', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support.manage', 'Quản lý ticket hỗ trợ', 'Gán người xử lý, độ ưu tiên và trạng thái ticket.', 'support', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id", "created_at")
SELECT "roles"."id", "permissions"."id", CURRENT_TIMESTAMP
FROM "roles"
JOIN "permissions" ON "permissions"."key" IN ('support.read', 'support.reply', 'support.manage')
WHERE "roles"."key" = 'admin';
