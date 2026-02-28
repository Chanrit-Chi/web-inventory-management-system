-- DropForeignKey
ALTER TABLE "ProductOnAttribute" DROP CONSTRAINT "ProductOnAttribute_attributeId_fkey";

-- AddForeignKey
ALTER TABLE "ProductOnAttribute" ADD CONSTRAINT "ProductOnAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
