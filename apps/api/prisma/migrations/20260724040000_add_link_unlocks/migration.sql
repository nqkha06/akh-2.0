CREATE TABLE "link_unlocks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "link_id" INTEGER NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'ZZ',
    "device_type" TEXT NOT NULL DEFAULT 'desktop',
    "browser_family" TEXT NOT NULL DEFAULT 'other',
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "link_unlocks_link_id_fkey"
      FOREIGN KEY ("link_id") REFERENCES "stu_links" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "link_unlocks_link_id_created_at_idx"
  ON "link_unlocks"("link_id", "created_at");
CREATE INDEX "link_unlocks_created_at_idx"
  ON "link_unlocks"("created_at");
CREATE INDEX "link_unlocks_country_code_created_at_idx"
  ON "link_unlocks"("country_code", "created_at");
CREATE INDEX "link_unlocks_device_type_created_at_idx"
  ON "link_unlocks"("device_type", "created_at");
CREATE INDEX "link_unlocks_browser_family_created_at_idx"
  ON "link_unlocks"("browser_family", "created_at");
CREATE INDEX "link_unlocks_ip_address_created_at_idx"
  ON "link_unlocks"("ip_address", "created_at");
