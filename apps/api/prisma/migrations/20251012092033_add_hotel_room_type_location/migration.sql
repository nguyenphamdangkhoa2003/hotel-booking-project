/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Hotel` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Hotel` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Hotel` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Made the column `stars` on table `Hotel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Hotel" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "updatedAt",
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "locationId" TEXT NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "priceFrom" INTEGER,
ADD COLUMN     "priceTo" INTEGER,
ALTER COLUMN "stars" SET NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amenities" TEXT[],
    "priceFrom" INTEGER,
    "priceTo" INTEGER,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
