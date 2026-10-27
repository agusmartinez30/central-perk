-- CreateEnum
CREATE TYPE "VenueLinkNetwork" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'WEBSITE');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "BillRequestMode" AS ENUM ('TABLE', 'REGISTER', 'TRANSFER');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT NOT NULL,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressMapsUrl" TEXT,
    "whatsapp" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_links" (
    "venueId" TEXT NOT NULL,
    "network" "VenueLinkNetwork" NOT NULL,
    "position" INTEGER NOT NULL,
    "handle" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "venue_links_pkey" PRIMARY KEY ("venueId","network")
);

-- CreateTable
CREATE TABLE "venue_opening_hours" (
    "venueId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,

    CONSTRAINT "venue_opening_hours_pkey" PRIMARY KEY ("venueId","weekday")
);

-- CreateTable
CREATE TABLE "venue_payment_settings" (
    "venueId" TEXT NOT NULL,
    "acceptedMethods" "PaymentMethod"[],
    "billRequestModes" "BillRequestMode"[],
    "bankHolder" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankAlias" TEXT NOT NULL,
    "bankCbu" TEXT NOT NULL,
    "staffInstructions" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_payment_settings_pkey" PRIMARY KEY ("venueId")
);

-- AddForeignKey
ALTER TABLE "venue_links" ADD CONSTRAINT "venue_links_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_opening_hours" ADD CONSTRAINT "venue_opening_hours_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_payment_settings" ADD CONSTRAINT "venue_payment_settings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
