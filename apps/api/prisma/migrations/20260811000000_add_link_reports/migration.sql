CREATE TABLE "link_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reported_url" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "link_reports_reference_key" ON "link_reports"("reference");
CREATE INDEX "link_reports_status_created_at_idx" ON "link_reports"("status", "created_at");
CREATE INDEX "link_reports_email_created_at_idx" ON "link_reports"("email", "created_at");
