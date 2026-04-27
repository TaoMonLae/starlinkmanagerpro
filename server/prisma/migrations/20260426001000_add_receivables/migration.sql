-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'RECEIVABLE';

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'WAIVED');

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "paymentId" TEXT,
    "debtorName" TEXT NOT NULL,
    "debtorContact" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "amountReceived" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "status" "ReceivableStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Receivable_accountId_idx" ON "Receivable"("accountId");

-- CreateIndex
CREATE INDEX "Receivable_paymentId_idx" ON "Receivable"("paymentId");

-- CreateIndex
CREATE INDEX "Receivable_status_idx" ON "Receivable"("status");

-- CreateIndex
CREATE INDEX "Receivable_dueDate_idx" ON "Receivable"("dueDate");

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
