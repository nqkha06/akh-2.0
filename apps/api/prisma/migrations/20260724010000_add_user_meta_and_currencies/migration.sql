CREATE TABLE "user_meta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value_json" TEXT NOT NULL,
    "value_type" TEXT NOT NULL DEFAULT 'json',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_meta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "currencies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange_rate" DECIMAL NOT NULL DEFAULT 1,
    "decimal_digits" INTEGER NOT NULL DEFAULT 2,
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "user_meta_user_id_key_key" ON "user_meta"("user_id", "key");
CREATE INDEX "user_meta_key_idx" ON "user_meta"("key");
CREATE INDEX "user_meta_user_id_updated_at_idx" ON "user_meta"("user_id", "updated_at");

CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");
CREATE INDEX "currencies_is_base_idx" ON "currencies"("is_base");
CREATE INDEX "currencies_is_default_idx" ON "currencies"("is_default");
CREATE INDEX "currencies_is_active_sort_order_idx" ON "currencies"("is_active", "sort_order");
CREATE UNIQUE INDEX "currencies_single_base_key" ON "currencies"("is_base") WHERE "is_base" = true;
CREATE UNIQUE INDEX "currencies_single_default_key" ON "currencies"("is_default") WHERE "is_default" = true;

INSERT INTO "currencies" (
    "code", "name", "symbol", "exchange_rate", "decimal_digits",
    "is_base", "is_default", "is_active", "sort_order", "created_at", "updated_at"
) VALUES
    ('USD', 'US Dollar', '$', 1, 2, true, true, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('VND', 'Vietnamese đồng', '₫', 22000, 0, false, false, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "permissions" (
    "key", "name", "description", "group", "created_at", "updated_at"
) VALUES
    ('currencies.read', 'Xem cấu hình tiền tệ', 'Xem danh mục tiền tệ và tỷ giá quy đổi của website.', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('currencies.create', 'Tạo tiền tệ', 'Thêm tiền tệ hiển thị mới cho website.', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('currencies.update', 'Sửa tiền tệ', 'Cập nhật tỷ giá, trạng thái và tiền tệ mặc định.', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('currencies.delete', 'Xóa tiền tệ', 'Xóa tiền tệ chưa còn được người dùng lựa chọn.', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id", "created_at")
SELECT "roles"."id", "permissions"."id", CURRENT_TIMESTAMP
FROM "roles"
JOIN "permissions" ON "permissions"."key" IN (
    'currencies.read',
    'currencies.create',
    'currencies.update',
    'currencies.delete'
)
WHERE "roles"."key" = 'admin';
