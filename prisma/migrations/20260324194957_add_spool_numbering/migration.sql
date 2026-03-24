/*
  Warnings:

  - Added the required column `spoolNumber` to the `Spool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Spool" ADD COLUMN     "spoolNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nextSpoolNumber" INTEGER NOT NULL DEFAULT 1;
