/*
  Warnings:

  - Added the required column `description` to the `unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `unit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "unit" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
