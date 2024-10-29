/*
  Warnings:

  - You are about to drop the column `etat` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `services` table. All the data in the column will be lost.
  - You are about to drop the `factures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transfers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[compteId]` on the table `agents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[compteId]` on the table `operateurs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[compteId]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `operateurId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montantPlafond` to the `portefeuilles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomService` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransfertStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "factures" DROP CONSTRAINT "factures_compteId_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_senderId_fkey";

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "etat";

-- AlterTable
ALTER TABLE "comptes" ADD COLUMN     "status" "Etat" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "operateurId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "portefeuilles" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "montantPlafond" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "services" DROP COLUMN "qrCode",
ADD COLUMN     "nomService" TEXT NOT NULL;

-- DropTable
DROP TABLE "factures";

-- DropTable
DROP TABLE "transfers";

-- DropEnum
DROP TYPE "FactureStatus";

-- DropEnum
DROP TYPE "TransferStatus";

-- CreateTable
CREATE TABLE "superadmins" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "photo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferts" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frais" DOUBLE PRECISION NOT NULL,
    "status" "TransfertStatus" NOT NULL DEFAULT 'PENDING',
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activations" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "porteFeuilleId" INTEGER NOT NULL,
    "expiration" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "compteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "superadmins_compteId_key" ON "superadmins"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_compteId_key" ON "admins"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_compteId_key" ON "clients"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_compteId_key" ON "agents"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "operateurs_compteId_key" ON "operateurs"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "services_compteId_key" ON "services"("compteId");

-- AddForeignKey
ALTER TABLE "superadmins" ADD CONSTRAINT "superadmins_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "operateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activations" ADD CONSTRAINT "activations_porteFeuilleId_fkey" FOREIGN KEY ("porteFeuilleId") REFERENCES "portefeuilles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
