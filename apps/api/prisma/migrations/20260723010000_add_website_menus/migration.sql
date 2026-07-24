PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "website_menus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "draft_version" INTEGER NOT NULL DEFAULT 1,
    "published_version" INTEGER NOT NULL DEFAULT 0,
    "published_snapshot_json" TEXT,
    "published_at" DATETIME,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "website_menus_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "website_menus_updated_by_id_fkey"
      FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "website_menu_translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menu_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "website_menu_translations_menu_id_fkey"
      FOREIGN KEY ("menu_id") REFERENCES "website_menus" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "website_menu_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menu_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "page_id" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM_URL',
    "url" TEXT,
    "target" TEXT NOT NULL DEFAULT 'SELF',
    "rel" TEXT,
    "icon_key" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "website_menu_items_menu_id_fkey"
      FOREIGN KEY ("menu_id") REFERENCES "website_menus" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "website_menu_items_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "website_menu_items" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "website_menu_items_page_id_fkey"
      FOREIGN KEY ("page_id") REFERENCES "pages" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "website_menu_item_translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menu_item_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT,
    "aria_label" TEXT,
    "url_override" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "website_menu_item_translations_menu_item_id_fkey"
      FOREIGN KEY ("menu_item_id") REFERENCES "website_menu_items" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "website_menu_locations" (
    "location" TEXT NOT NULL PRIMARY KEY,
    "menu_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "website_menu_locations_menu_id_fkey"
      FOREIGN KEY ("menu_id") REFERENCES "website_menus" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "website_menu_locations_updated_by_id_fkey"
      FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "website_menus_key_key" ON "website_menus"("key");
CREATE INDEX "website_menus_status_updated_at_idx" ON "website_menus"("status", "updated_at");
CREATE INDEX "website_menus_deleted_at_idx" ON "website_menus"("deleted_at");
CREATE INDEX "website_menus_created_by_id_idx" ON "website_menus"("created_by_id");
CREATE INDEX "website_menus_updated_by_id_idx" ON "website_menus"("updated_by_id");
CREATE UNIQUE INDEX "website_menu_translations_menu_id_locale_key"
  ON "website_menu_translations"("menu_id", "locale");
CREATE INDEX "website_menu_translations_locale_idx"
  ON "website_menu_translations"("locale");
CREATE INDEX "website_menu_items_menu_id_parent_id_sort_order_idx"
  ON "website_menu_items"("menu_id", "parent_id", "sort_order");
CREATE INDEX "website_menu_items_page_id_idx" ON "website_menu_items"("page_id");
CREATE INDEX "website_menu_items_deleted_at_idx" ON "website_menu_items"("deleted_at");
CREATE UNIQUE INDEX "website_menu_item_translations_menu_item_id_locale_key"
  ON "website_menu_item_translations"("menu_item_id", "locale");
CREATE INDEX "website_menu_item_translations_locale_idx"
  ON "website_menu_item_translations"("locale");
CREATE INDEX "website_menu_locations_menu_id_idx"
  ON "website_menu_locations"("menu_id");
CREATE INDEX "website_menu_locations_updated_by_id_idx"
  ON "website_menu_locations"("updated_by_id");

-- Preserve the public navigation that existed before menus became managed.
INSERT INTO "website_menus" (
    "id", "key", "name", "description", "status", "draft_version",
    "published_version", "published_snapshot_json", "published_at",
    "created_at", "updated_at"
) VALUES
    (1, 'main-navigation', 'Điều hướng chính', 'Liên kết chính trên header và mobile.', 'published', 1, 1,
    '{"schemaVersion":1,"menuId":1,"key":"main-navigation","version":1,"defaultLocale":"vi","translations":{"vi":{"title":"Điều hướng chính"},"en":{"title":"Main navigation"}},"items":[{"id":1,"type":"ANCHOR","pageId":null,"url":"#how-it-works","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Cách hoạt động","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"How it works","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]},{"id":2,"type":"ANCHOR","pageId":null,"url":"#features","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Tính năng","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Features","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]},{"id":3,"type":"ANCHOR","pageId":null,"url":"#creators","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Nhà sáng tạo","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Creators","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]},{"id":4,"type":"ANCHOR","pageId":null,"url":"#pricing","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Bảng giá","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Pricing","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]}]}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'header-actions', 'Hành động header', 'Đăng nhập và đăng ký.', 'published', 1, 1,
    '{"schemaVersion":1,"menuId":2,"key":"header-actions","version":1,"defaultLocale":"vi","translations":{"vi":{"title":"Hành động"},"en":{"title":"Actions"}},"items":[{"id":5,"type":"CUSTOM_URL","pageId":null,"url":"/login","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Đăng nhập","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Sign in","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]},{"id":6,"type":"CUSTOM_URL","pageId":null,"url":"/register","pageUrl":null,"target":"SELF","rel":null,"iconKey":"arrow-right","translations":{"vi":{"label":"Bắt đầu tạo","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Start creating","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]}]}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'footer-navigation', 'Điều hướng footer', 'Các nhóm liên kết chính ở footer.', 'published', 1, 1,
    '{"schemaVersion":1,"menuId":3,"key":"footer-navigation","version":1,"defaultLocale":"vi","translations":{"vi":{"title":"Footer"},"en":{"title":"Footer"}},"items":[{"id":7,"type":"GROUP","pageId":null,"url":null,"pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Sản phẩm","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Product","title":null,"ariaLabel":null,"urlOverride":null}},"children":[{"id":8,"type":"ANCHOR","pageId":null,"url":"#features","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Tính năng","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Features","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]},{"id":9,"type":"ANCHOR","pageId":null,"url":"#creators","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Trang nhà sáng tạo","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Creator pages","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]}]},{"id":10,"type":"GROUP","pageId":null,"url":null,"pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Tài nguyên","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Resources","title":null,"ariaLabel":null,"urlOverride":null}},"children":[{"id":11,"type":"CUSTOM_URL","pageId":null,"url":"/","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Trung tâm trợ giúp","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Help center","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]}]},{"id":12,"type":"GROUP","pageId":null,"url":null,"pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Công ty","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Company","title":null,"ariaLabel":null,"urlOverride":null}},"children":[{"id":13,"type":"CUSTOM_URL","pageId":null,"url":"/","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Liên hệ","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Contact","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]}]}]}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 'footer-legal', 'Pháp lý footer', 'Liên kết pháp lý dưới footer.', 'published', 1, 1,
    '{"schemaVersion":1,"menuId":4,"key":"footer-legal","version":1,"defaultLocale":"vi","translations":{"vi":{"title":"Pháp lý"},"en":{"title":"Legal"}},"items":[{"id":14,"type":"CUSTOM_URL","pageId":null,"url":"/privacy","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Quyền riêng tư","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Privacy","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]},{"id":15,"type":"CUSTOM_URL","pageId":null,"url":"/terms","pageUrl":null,"target":"SELF","rel":null,"iconKey":null,"translations":{"vi":{"label":"Điều khoản","title":null,"ariaLabel":null,"urlOverride":null},"en":{"label":"Terms","title":null,"ariaLabel":null,"urlOverride":null}},"children":[]}]}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "website_menu_translations" ("menu_id", "locale", "title", "created_at", "updated_at") VALUES
    (1, 'vi', 'Điều hướng chính', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1, 'en', 'Main navigation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'vi', 'Hành động', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'en', 'Actions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'vi', 'Footer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'en', 'Footer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 'vi', 'Pháp lý', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 'en', 'Legal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "website_menu_items" (
    "id", "menu_id", "parent_id", "type", "url", "target", "icon_key",
    "is_enabled", "sort_order", "created_at", "updated_at"
) VALUES
    (1, 1, NULL, 'ANCHOR', '#how-it-works', 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 1, NULL, 'ANCHOR', '#features', 'SELF', NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 1, NULL, 'ANCHOR', '#creators', 'SELF', NULL, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 1, NULL, 'ANCHOR', '#pricing', 'SELF', NULL, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (5, 2, NULL, 'CUSTOM_URL', '/login', 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (6, 2, NULL, 'CUSTOM_URL', '/register', 'SELF', 'arrow-right', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (7, 3, NULL, 'GROUP', NULL, 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (8, 3, 7, 'ANCHOR', '#features', 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (9, 3, 7, 'ANCHOR', '#creators', 'SELF', NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (10, 3, NULL, 'GROUP', NULL, 'SELF', NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (11, 3, 10, 'CUSTOM_URL', '/', 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (12, 3, NULL, 'GROUP', NULL, 'SELF', NULL, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (13, 3, 12, 'CUSTOM_URL', '/', 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (14, 4, NULL, 'CUSTOM_URL', '/privacy', 'SELF', NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (15, 4, NULL, 'CUSTOM_URL', '/terms', 'SELF', NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "website_menu_item_translations" (
    "menu_item_id", "locale", "label", "created_at", "updated_at"
) VALUES
    (1, 'vi', 'Cách hoạt động', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (1, 'en', 'How it works', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'vi', 'Tính năng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (2, 'en', 'Features', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'vi', 'Nhà sáng tạo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (3, 'en', 'Creators', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 'vi', 'Bảng giá', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (4, 'en', 'Pricing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (5, 'vi', 'Đăng nhập', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (5, 'en', 'Sign in', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (6, 'vi', 'Bắt đầu tạo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (6, 'en', 'Start creating', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (7, 'vi', 'Sản phẩm', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (7, 'en', 'Product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (8, 'vi', 'Tính năng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (8, 'en', 'Features', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (9, 'vi', 'Trang nhà sáng tạo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (9, 'en', 'Creator pages', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (10, 'vi', 'Tài nguyên', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (10, 'en', 'Resources', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (11, 'vi', 'Trung tâm trợ giúp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (11, 'en', 'Help center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (12, 'vi', 'Công ty', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (12, 'en', 'Company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (13, 'vi', 'Liên hệ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (13, 'en', 'Contact', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (14, 'vi', 'Quyền riêng tư', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (14, 'en', 'Privacy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (15, 'vi', 'Điều khoản', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (15, 'en', 'Terms', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "website_menu_locations" ("location", "menu_id", "updated_at") VALUES
    ('header-primary', 1, CURRENT_TIMESTAMP),
    ('mobile-primary', 1, CURRENT_TIMESTAMP),
    ('header-actions', 2, CURRENT_TIMESTAMP),
    ('footer-primary', 3, CURRENT_TIMESTAMP),
    ('footer-legal', 4, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "permissions" (
    "key", "name", "description", "group", "created_at", "updated_at"
) VALUES
    ('menus.read', 'Xem menu website', 'Xem menu, vị trí hiển thị và bản nháp hiện tại.', 'menus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menus.create', 'Tạo menu website', 'Tạo menu điều hướng mới.', 'menus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menus.update', 'Sửa menu website', 'Cập nhật cấu trúc và bản dịch menu.', 'menus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menus.delete', 'Xóa menu website', 'Xóa menu chưa còn được gán vị trí.', 'menus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menus.publish', 'Xuất bản menu website', 'Xuất bản hoặc gỡ xuất bản snapshot menu.', 'menus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('menus.assign', 'Gán vị trí menu website', 'Gán menu đã quản lý vào các vị trí công khai.', 'menus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "role_has_permissions" ("role_id", "permission_id")
SELECT role."id", permission."id"
FROM "roles" role
CROSS JOIN "permissions" permission
WHERE role."key" = 'admin'
  AND permission."key" LIKE 'menus.%';

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
