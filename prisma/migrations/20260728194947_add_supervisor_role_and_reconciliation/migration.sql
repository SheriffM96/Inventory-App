-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERVISOR';

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReconciliation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cashTotal" DECIMAL(12,2) NOT NULL,
    "transferTotal" DECIMAL(12,2) NOT NULL,
    "posTotal" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "managerNotes" TEXT,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleLine" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantitySold" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_name_key" ON "MenuItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReconciliation_date_key" ON "DailyReconciliation"("date");

-- CreateIndex
CREATE INDEX "DailyReconciliation_date_idx" ON "DailyReconciliation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SaleLine_reconciliationId_menuItemId_key" ON "SaleLine"("reconciliationId", "menuItemId");

-- AddForeignKey
ALTER TABLE "DailyReconciliation" ADD CONSTRAINT "DailyReconciliation_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReconciliation" ADD CONSTRAINT "DailyReconciliation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "DailyReconciliation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
