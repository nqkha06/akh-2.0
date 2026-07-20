CREATE TABLE "languages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "native_name" TEXT,
    "locale" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "regional" TEXT,
    "flag" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_rtl" BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX "languages_locale_key" ON "languages"("locale");
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");
CREATE INDEX "languages_is_default_idx" ON "languages"("is_default");
CREATE INDEX "languages_is_enabled_order_idx"
ON "languages"("is_enabled", "order");

INSERT INTO "languages" (
    "name", "native_name", "locale", "code", "regional", "flag",
    "is_default", "is_enabled", "order", "is_rtl"
) VALUES
    ('Vietnamese', 'Tiếng Việt', 'vi', 'vi', 'vi-VN', 'VN', true, true, 10, false),
    ('English', 'English', 'en', 'en', 'en-US', 'US', false, true, 20, false);
