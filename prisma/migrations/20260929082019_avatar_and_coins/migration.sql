-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;

-- CreateTable
CREATE TABLE "CoinTx" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTx_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CoinTx_refKey_key" ON "CoinTx"("refKey");

-- CreateIndex
CREATE INDEX "CoinTx_userId_idx" ON "CoinTx"("userId");
