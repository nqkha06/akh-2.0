CREATE TABLE "pages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content_json" TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    "content_html" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured_image_id" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "canonical_url" TEXT,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "pages_featured_image_id_fkey"
      FOREIGN KEY ("featured_image_id") REFERENCES "ManagedFile" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");
CREATE INDEX "pages_status_sort_order_idx" ON "pages"("status", "sort_order");
CREATE INDEX "pages_created_at_idx" ON "pages"("created_at");
CREATE INDEX "pages_updated_at_idx" ON "pages"("updated_at");
CREATE INDEX "pages_published_at_idx" ON "pages"("published_at");
CREATE INDEX "pages_deleted_at_idx" ON "pages"("deleted_at");
CREATE INDEX "pages_featured_image_id_idx" ON "pages"("featured_image_id");
