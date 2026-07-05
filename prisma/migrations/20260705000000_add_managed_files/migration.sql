-- CreateTable
CREATE TABLE "ManagedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "extension" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagedFile_alias_key" ON "ManagedFile"("alias");

-- CreateIndex
CREATE INDEX "ManagedFile_createdAt_idx" ON "ManagedFile"("createdAt");

-- CreateIndex
CREATE INDEX "ManagedFile_deletedAt_idx" ON "ManagedFile"("deletedAt");

-- CreateIndex
CREATE INDEX "ManagedFile_status_idx" ON "ManagedFile"("status");
