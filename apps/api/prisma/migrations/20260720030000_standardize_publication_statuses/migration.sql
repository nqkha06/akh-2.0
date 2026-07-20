ALTER TABLE "languages"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';

UPDATE "languages"
SET "status" = CASE
  WHEN "is_enabled" = true THEN 'published'
  ELSE 'draft'
END;

DROP INDEX IF EXISTS "languages_is_enabled_order_idx";

CREATE INDEX "languages_status_order_idx"
ON "languages"("status", "order");

UPDATE "payment_methods"
SET "status" = CASE
  WHEN "status" = 'active' THEN 'published'
  WHEN "status" = 'inactive' THEN 'draft'
  WHEN "status" IN ('draft', 'pending', 'published') THEN "status"
  ELSE 'pending'
END;

UPDATE "stu_monetization_levels"
SET "status" = CASE
  WHEN "status" = 'active' THEN 'published'
  WHEN "status" = 'draft' THEN 'draft'
  WHEN "status" IN ('pending', 'published') THEN "status"
  ELSE 'pending'
END;
