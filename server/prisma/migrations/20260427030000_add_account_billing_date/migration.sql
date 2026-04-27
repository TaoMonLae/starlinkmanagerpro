ALTER TABLE "Account" ADD COLUMN "billingDate" TIMESTAMP(3);

UPDATE "Account"
SET "billingDate" = date_trunc('month', CURRENT_DATE) + (LEAST(GREATEST("billingDay", 1), 28) - 1) * INTERVAL '1 day' + INTERVAL '12 hours'
WHERE "billingDate" IS NULL;
