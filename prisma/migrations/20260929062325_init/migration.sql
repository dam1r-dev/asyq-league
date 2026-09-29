-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "university" TEXT,
    "saqaSkin" TEXT NOT NULL DEFAULT 'saqa-classic',
    "fieldSkin" TEXT NOT NULL DEFAULT 'field-aula',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "dayKey" TEXT,
    "score" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,
    "throwsUsed" INTEGER NOT NULL,
    "knocked" INTEGER NOT NULL,
    "inputs" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "priceKzt" INTEGER NOT NULL,
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Attempt_userId_levelId_idx" ON "Attempt"("userId", "levelId");

-- CreateIndex
CREATE INDEX "Attempt_dayKey_score_idx" ON "Attempt"("dayKey", "score");

-- CreateIndex
CREATE INDEX "Attempt_createdAt_idx" ON "Attempt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_userId_itemId_key" ON "Purchase"("userId", "itemId");
