UPDATE "stu_links"
SET "views" = "views" + "clicks";

DROP TABLE IF EXISTS "link_unlocks";

ALTER TABLE "stu_links" DROP COLUMN "clicks";
