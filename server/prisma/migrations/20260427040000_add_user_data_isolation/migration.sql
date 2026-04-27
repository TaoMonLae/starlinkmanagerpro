ALTER TABLE "Account" ADD COLUMN "userId" TEXT;
ALTER TABLE "ManagedOwner" ADD COLUMN "userId" TEXT;
ALTER TABLE "Receivable" ADD COLUMN "userId" TEXT;

UPDATE "Account"
SET "userId" = COALESCE(
  (SELECT "userId" FROM "Payment" WHERE "Payment"."accountId" = "Account"."id" AND "Payment"."userId" IS NOT NULL ORDER BY "Payment"."createdAt" ASC LIMIT 1),
  (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "userId" IS NULL;

UPDATE "ManagedOwner"
SET "userId" = COALESCE(
  (SELECT "userId" FROM "Account" WHERE "Account"."ownerId" = "ManagedOwner"."id" LIMIT 1),
  (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "userId" IS NULL;

UPDATE "Receivable"
SET "userId" = COALESCE(
  (SELECT "userId" FROM "Account" WHERE "Account"."id" = "Receivable"."accountId"),
  (SELECT "userId" FROM "Payment" WHERE "Payment"."id" = "Receivable"."paymentId"),
  (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "userId" IS NULL;

ALTER TABLE "Account" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "ManagedOwner" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Receivable" ALTER COLUMN "userId" SET NOT NULL;

DROP INDEX IF EXISTS "Account_gmailEmail_key";
CREATE UNIQUE INDEX "Account_userId_gmailEmail_key" ON "Account"("userId", "gmailEmail");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "ManagedOwner_userId_idx" ON "ManagedOwner"("userId");
CREATE INDEX "Receivable_userId_idx" ON "Receivable"("userId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManagedOwner" ADD CONSTRAINT "ManagedOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
