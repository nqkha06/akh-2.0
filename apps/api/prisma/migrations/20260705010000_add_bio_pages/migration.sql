-- CreateTable
CREATE TABLE "BioPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "backgroundImage" TEXT,
    "socialLinksJson" TEXT NOT NULL DEFAULT '[]',
    "customLinksJson" TEXT NOT NULL DEFAULT '[]',
    "widgetsJson" TEXT NOT NULL DEFAULT '[]',
    "hiddenLinksJson" TEXT NOT NULL DEFAULT '[]',
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BioPage_slug_key" ON "BioPage"("slug");

-- CreateIndex
CREATE INDEX "BioPage_createdAt_idx" ON "BioPage"("createdAt");

-- CreateIndex
CREATE INDEX "BioPage_status_idx" ON "BioPage"("status");
