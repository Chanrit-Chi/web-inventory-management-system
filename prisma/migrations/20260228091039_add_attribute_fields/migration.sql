-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('SELECT', 'COLOR', 'TEXT');

-- DropForeignKey
ALTER TABLE "ProductAttributeValue" DROP CONSTRAINT "ProductAttributeValue_attributeId_fkey";

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "AttributeType" NOT NULL DEFAULT 'SELECT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProductAttributeValue" ADD COLUMN     "colorHex" TEXT,
ADD COLUMN     "displayValue" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
