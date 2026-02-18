-- AlterTable
ALTER TABLE "Material"
ADD COLUMN "subType" TEXT,
ADD COLUMN "materialKind" TEXT,
ADD COLUMN "shapeType" TEXT,
ADD COLUMN "dimAmm" INTEGER,
ADD COLUMN "dimBmm" INTEGER,
ADD COLUMN "thicknessMm" INTEGER,
ADD COLUMN "sheetWidthMm" INTEGER,
ADD COLUMN "sheetHeightMm" INTEGER,
ADD COLUMN "packageSize" DOUBLE PRECISION,
ADD COLUMN "packageUnit" TEXT,
ADD COLUMN "specText" TEXT,
ADD COLUMN "unitType" TEXT,
ADD COLUMN "unitVariant" TEXT,
ADD COLUMN "fingerprint" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Material_fingerprint_key" ON "Material"("fingerprint");
