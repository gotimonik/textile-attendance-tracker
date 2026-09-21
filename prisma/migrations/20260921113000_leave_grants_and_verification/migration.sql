-- CreateEnum
CREATE TYPE "AttendanceVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "paidLeavesPerMonth";

-- AlterTable
ALTER TABLE "workers" DROP COLUMN "paidLeaveQuotaOverride";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "markedBySelf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationStatus" "AttendanceVerificationStatus";

-- CreateTable
CREATE TABLE "paid_leave_grants" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,
    "workerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "paid_leave_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "paid_leave_grants_organizationId_month_idx" ON "paid_leave_grants"("organizationId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "paid_leave_grants_workerId_month_key" ON "paid_leave_grants"("workerId", "month");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_verificationStatus_idx" ON "attendance_records"("organizationId", "verificationStatus");

-- AddForeignKey
ALTER TABLE "paid_leave_grants" ADD CONSTRAINT "paid_leave_grants_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_leave_grants" ADD CONSTRAINT "paid_leave_grants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

