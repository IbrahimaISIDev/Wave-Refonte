/*
  Warnings:

  - You are about to drop the column `password` on the `comptes` table. All the data in the column will be lost.
  - Added the required column `secretCode` to the `comptes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "comptes" DROP COLUMN "password",
ADD COLUMN     "secretCode" TEXT NOT NULL;
