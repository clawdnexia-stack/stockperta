-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "stockAfter" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Movement_materialId_createdAt_idx" ON "Movement"("materialId", "createdAt");
