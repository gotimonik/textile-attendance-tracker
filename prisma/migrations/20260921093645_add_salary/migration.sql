-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "salaryDivisorDays" INTEGER;

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "monthlySalary" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "salary_adjustments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "salary_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_adjustments_workerId_month_idx" ON "salary_adjustments"("workerId", "month");

-- CreateIndex
CREATE INDEX "salary_adjustments_organizationId_month_idx" ON "salary_adjustments"("organizationId", "month");

-- AddForeignKey
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

