-- AlterTable
ALTER TABLE "user" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;
