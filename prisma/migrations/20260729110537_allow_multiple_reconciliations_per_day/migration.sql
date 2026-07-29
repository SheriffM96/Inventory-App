-- DropForeignKey
ALTER TABLE "SaleLine" DROP CONSTRAINT "SaleLine_reconciliationId_fkey";

-- DropIndex
DROP INDEX "DailyReconciliation_date_key";

-- AlterTable
ALTER TABLE "DailyReconciliation" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "DailyReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
