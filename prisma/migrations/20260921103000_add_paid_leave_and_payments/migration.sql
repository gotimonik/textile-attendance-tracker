-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "paidLeavesPerMonth" INTEGER;

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "paidLeaveQuotaOverride" INTEGER;

-- CreateTable
CREATE TABLE "salary_payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "month" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_payments_organizationId_month_idx" ON "salary_payments"("organizationId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "salary_payments_workerId_month_key" ON "salary_payments"("workerId", "month");

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

