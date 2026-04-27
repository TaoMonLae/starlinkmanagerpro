-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'OWNER';

-- CreateTable
CREATE TABLE "ManagedOwner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedOwner_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Account" ADD COLUMN "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Account_ownerId_idx" ON "Account"("ownerId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "ManagedOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

