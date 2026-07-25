ALTER TABLE "stu_links"
  ADD COLUMN "legacy_views" INTEGER NOT NULL DEFAULT 0;

UPDATE "stu_links"
SET "legacy_views" = "clicks",
    "clicks" = 0;
