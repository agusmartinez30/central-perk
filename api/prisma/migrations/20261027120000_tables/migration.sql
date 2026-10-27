-- CreateEnum
CREATE TYPE "SpaceIcon" AS ENUM ('STORE', 'SUN', 'TREES', 'MAP_PIN');

-- CreateEnum
CREATE TYPE "SpaceTone" AS ENUM ('BRAND', 'WARNING', 'SUCCESS', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "TableShape" AS ENUM ('RECT', 'ROUND');

-- CreateTable
CREATE TABLE "venue_spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" "SpaceIcon" NOT NULL,
    "tone" "SpaceTone" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "venue_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_tables" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "layoutX" INTEGER NOT NULL,
    "layoutY" INTEGER NOT NULL,
    "layoutWidth" INTEGER NOT NULL,
    "layoutHeight" INTEGER NOT NULL,
    "layoutShape" "TableShape" NOT NULL DEFAULT 'RECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_qr_credentials" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tableId" TEXT,
    "tableNumber" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "issuedById" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "auditNumber" INTEGER,

    CONSTRAINT "table_qr_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venue_tables_number_key" ON "venue_tables"("number");

-- CreateIndex
CREATE UNIQUE INDEX "venue_tables_label_key" ON "venue_tables"("label");

-- CreateIndex
CREATE INDEX "venue_tables_spaceId_idx" ON "venue_tables"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "table_qr_credentials_token_key" ON "table_qr_credentials"("token");

-- CreateIndex
CREATE UNIQUE INDEX "table_qr_credentials_auditNumber_key" ON "table_qr_credentials"("auditNumber");

-- CreateIndex
CREATE INDEX "table_qr_credentials_tableId_idx" ON "table_qr_credentials"("tableId");

-- AddForeignKey
ALTER TABLE "venue_tables" ADD CONSTRAINT "venue_tables_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "venue_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_qr_credentials" ADD CONSTRAINT "table_qr_credentials_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "venue_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_qr_credentials" ADD CONSTRAINT "table_qr_credentials_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

