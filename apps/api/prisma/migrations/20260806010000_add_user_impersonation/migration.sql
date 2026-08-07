ALTER TABLE "auth_sessions"
ADD COLUMN "impersonator_user_id" INTEGER;

ALTER TABLE "auth_sessions"
ADD COLUMN "impersonator_session_id" TEXT;

CREATE INDEX "auth_sessions_impersonator_user_id_idx"
ON "auth_sessions"("impersonator_user_id");

INSERT INTO "permissions" (
    "key", "name", "description", "group", "created_at", "updated_at"
)
SELECT
    'users.impersonate',
    'Đăng nhập với tư cách người dùng',
    'Cho phép quản trị viên mở phiên member thay mặt người dùng để hỗ trợ và kiểm tra.',
    'users',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "permissions" WHERE "key" = 'users.impersonate'
);

INSERT INTO "role_has_permissions" (
    "role_id", "permission_id", "created_at"
)
SELECT role."id", permission."id", CURRENT_TIMESTAMP
FROM "roles" role
JOIN "permissions" permission ON permission."key" = 'users.impersonate'
WHERE role."key" = 'admin'
  AND NOT EXISTS (
      SELECT 1
      FROM "role_has_permissions" assignment
      WHERE assignment."role_id" = role."id"
        AND assignment."permission_id" = permission."id"
  );
