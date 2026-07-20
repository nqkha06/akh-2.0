PRAGMA foreign_keys=OFF;

CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE "permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE "role_has_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("role_id", "permission_id"),
    CONSTRAINT "role_has_permissions_role_id_fkey"
        FOREIGN KEY ("role_id") REFERENCES "roles" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_has_permissions_permission_id_fkey"
        FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "user_has_roles" (
    "role_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("role_id", "user_id"),
    CONSTRAINT "user_has_roles_role_id_fkey"
        FOREIGN KEY ("role_id") REFERENCES "roles" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_has_roles_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "user_has_permissions" (
    "permission_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("permission_id", "user_id"),
    CONSTRAINT "user_has_permissions_permission_id_fkey"
        FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_has_permissions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "permissions_group_idx" ON "permissions"("group");
CREATE INDEX "role_has_permissions_permission_id_idx"
    ON "role_has_permissions"("permission_id");
CREATE INDEX "user_has_roles_user_id_idx" ON "user_has_roles"("user_id");
CREATE INDEX "user_has_permissions_user_id_idx"
    ON "user_has_permissions"("user_id");

INSERT INTO "roles" (
    "key", "name", "description", "is_system", "created_at", "updated_at"
) VALUES
    ('admin', 'Administrator', 'Toàn quyền quản trị hệ thống.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('member', 'Member', 'Tài khoản thành viên mặc định.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "permissions" (
    "key", "name", "description", "group", "created_at", "updated_at"
) VALUES
    ('admin.access', 'Truy cập quản trị', 'Cho phép truy cập khu vực admin.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('users.read', 'Xem người dùng', 'Xem danh sách và chi tiết người dùng.', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('users.create', 'Tạo người dùng', 'Tạo tài khoản từ trang quản trị.', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('users.update', 'Sửa người dùng', 'Cập nhật tài khoản và phân quyền người dùng.', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('users.delete', 'Xóa người dùng', 'Xóa tài khoản không còn dữ liệu liên quan.', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('roles.read', 'Xem phân quyền', 'Xem role và permission.', 'authorization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('roles.create', 'Tạo role', 'Tạo role tùy chỉnh.', 'authorization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('roles.update', 'Sửa role', 'Cập nhật role và permission của role.', 'authorization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('roles.delete', 'Xóa role', 'Xóa role tùy chỉnh chưa được sử dụng.', 'authorization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "role_has_permissions" ("role_id", "permission_id")
SELECT role."id", permission."id"
FROM "roles" role
CROSS JOIN "permissions" permission
WHERE role."key" = 'admin';

INSERT INTO "user_has_roles" ("role_id", "user_id")
SELECT role."id", user."id"
FROM "users" user
JOIN "roles" role ON role."key" = CASE
    WHEN user."role" = 'admin' THEN 'admin'
    ELSE 'member'
END;

CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" DATETIME,
    "password" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

INSERT INTO "new_users" (
    "id", "name", "email", "email_verified_at", "password", "avatar",
    "status", "token_version", "created_at", "updated_at"
)
SELECT
    "id", "name", "email", "email_verified_at", "password", "avatar",
    "status", "token_version", "created_at", "updated_at"
FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_status_idx" ON "users"("status");

PRAGMA foreign_keys=ON;
