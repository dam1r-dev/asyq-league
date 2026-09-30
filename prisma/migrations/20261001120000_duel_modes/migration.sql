-- AlterTable
ALTER TABLE "Match" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "Match" ADD COLUMN "field" TEXT;
