CREATE INDEX "stu_access_logs_created_at_idx"
  ON "stu_access_logs"("created_at");

CREATE TABLE "stu_access_log_reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "access_log_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "reviewed_by_id" INTEGER NOT NULL,
    "reviewed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stu_access_log_reviews_access_log_id_fkey"
      FOREIGN KEY ("access_log_id") REFERENCES "stu_access_logs" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stu_access_log_reviews_reviewed_by_id_fkey"
      FOREIGN KEY ("reviewed_by_id") REFERENCES "users" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "stu_access_log_reviews_access_log_id_key"
  ON "stu_access_log_reviews"("access_log_id");
CREATE INDEX "stu_access_log_reviews_status_reviewed_at_idx"
  ON "stu_access_log_reviews"("status", "reviewed_at");
CREATE INDEX "stu_access_log_reviews_reviewed_by_id_idx"
  ON "stu_access_log_reviews"("reviewed_by_id");
