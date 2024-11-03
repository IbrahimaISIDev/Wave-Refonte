-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN', 'SUPERADMIN', 'AGENT', 'SERVICE', 'OPERATEUR');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'PAYMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "Etat" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransfertStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "comptes" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "CNI" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Etat" NOT NULL DEFAULT 'INACTIVE',
    "secretCode" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "qrCodeUrl" TEXT,
    "lastActivityAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "loginAttempt" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadmins" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nomService" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operateurs" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "nomOperateur" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "adresse" TEXT NOT NULL,
    "nomAgence" TEXT NOT NULL,
    "registreCommerce" TEXT NOT NULL,
    "ninea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "compteId" INTEGER NOT NULL,
    "agentId" INTEGER NOT NULL,
    "porteFeuilleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portefeuilles" (
    "id" SERIAL NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "compteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "montantPlafond" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "portefeuilles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCESS',
    "compteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "operateurId" INTEGER NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "TemporaryCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporaryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_login_key" ON "comptes"("login");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_phone_key" ON "comptes"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "superadmins_compteId_key" ON "superadmins"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_compteId_key" ON "admins"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_compteId_key" ON "clients"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "services_compteId_key" ON "services"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "operateurs_compteId_key" ON "operateurs"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_compteId_key" ON "agents"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "portefeuilles_compteId_key" ON "portefeuilles"("compteId");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_tokens_token_key" ON "blacklist_tokens"("token");

-- AddForeignKey
ALTER TABLE "superadmins" ADD CONSTRAINT "superadmins_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operateurs" ADD CONSTRAINT "operateurs_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferts" ADD CONSTRAINT "transferts_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_porteFeuilleId_fkey" FOREIGN KEY ("porteFeuilleId") REFERENCES "portefeuilles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portefeuilles" ADD CONSTRAINT "portefeuilles_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "operateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activations" ADD CONSTRAINT "activations_porteFeuilleId_fkey" FOREIGN KEY ("porteFeuilleId") REFERENCES "portefeuilles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
