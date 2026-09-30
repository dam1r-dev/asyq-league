-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "guestName" TEXT,
    "hostToken" TEXT NOT NULL,
    "guestToken" TEXT,
    "hostUserId" TEXT,
    "guestUserId" TEXT,
    "inputs" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winner" INTEGER,
    "endReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "lastMoveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_code_key" ON "Match"("code");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");
