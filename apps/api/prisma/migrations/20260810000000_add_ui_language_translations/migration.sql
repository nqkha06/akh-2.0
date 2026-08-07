ALTER TABLE "languages" ADD COLUMN "ui_messages_json" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "languages" ADD COLUMN "ui_catalog_size" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "languages" ADD COLUMN "ui_translation_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "languages" ADD COLUMN "ui_updated_at" DATETIME;
