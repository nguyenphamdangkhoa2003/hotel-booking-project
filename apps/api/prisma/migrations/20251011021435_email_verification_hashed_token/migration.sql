/*
  Warnings:

  - A unique constraint covering the columns `[verifyTokenHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifyTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verifyTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_verifyTokenHash_key" ON "User"("verifyTokenHash");
