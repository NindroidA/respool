-- AlterTable
ALTER TABLE "Spool" ADD COLUMN     "bedTemperature" INTEGER,
ADD COLUMN     "presetId" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchaseLink" TEXT,
ADD COLUMN     "purchasePrice" INTEGER;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "labelFields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "labelTemplate" TEXT NOT NULL DEFAULT 'compact';

-- CreateTable
CREATE TABLE "FilamentPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'user',
    "brand" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorSecondary" TEXT,
    "filamentColorId" TEXT,
    "startingMass" INTEGER NOT NULL,
    "diameter" DOUBLE PRECISION,
    "printingTemperature" INTEGER,
    "bedTemperature" INTEGER,
    "purchaseLink" TEXT,
    "estimatedCost" INTEGER,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilamentPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FilamentPreset_userId_idx" ON "FilamentPreset"("userId");

-- CreateIndex
CREATE INDEX "FilamentPreset_brand_material_idx" ON "FilamentPreset"("brand", "material");

-- CreateIndex
CREATE UNIQUE INDEX "FilamentPreset_userId_name_key" ON "FilamentPreset"("userId", "name");

-- AddForeignKey
ALTER TABLE "Spool" ADD CONSTRAINT "Spool_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "FilamentPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilamentPreset" ADD CONSTRAINT "FilamentPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilamentPreset" ADD CONSTRAINT "FilamentPreset_filamentColorId_fkey" FOREIGN KEY ("filamentColorId") REFERENCES "FilamentColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
