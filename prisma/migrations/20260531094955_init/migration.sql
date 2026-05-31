-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inputType" TEXT NOT NULL DEFAULT 'url',
    "selectedSnippet" TEXT,
    "selectedFile" TEXT,
    "subtitle" TEXT,
    "customAlias" TEXT,
    "coverImageUrl" TEXT,
    "expiryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "expiryType" TEXT,
    "expiryDate" DATETIME,
    "expiryTime" TEXT,
    "maxClicks" INTEGER,
    "selectedBackgroundId" TEXT,
    "selectedBackgroundName" TEXT,
    "sameAsCoverImage" BOOLEAN NOT NULL DEFAULT false,
    "opacity" INTEGER NOT NULL DEFAULT 100,
    "blur" INTEGER NOT NULL DEFAULT 0,
    "saturation" INTEGER NOT NULL DEFAULT 100,
    "contrast" INTEGER NOT NULL DEFAULT 100,
    "grayscale" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LinkAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkAction_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_slug_key" ON "Link"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Link_customAlias_key" ON "Link"("customAlias");

-- CreateIndex
CREATE INDEX "LinkAction_linkId_idx" ON "LinkAction"("linkId");
