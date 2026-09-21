import type { Prisma } from "@prisma/client";

/**
 * Prisma where-fragment: attendance that counts toward stats, reports and
 * salary — admin-marked records (verificationStatus is null) or worker
 * self-marks a manager has approved. A pending or rejected self-mark is
 * excluded everywhere counts are computed, until a manager reviews it.
 *
 * Spread this into a `where` alongside date/org filters, e.g.
 *   where: { organizationId, date: { gte, lte }, ...VERIFIED_ATTENDANCE_WHERE }
 */
export const VERIFIED_ATTENDANCE_WHERE = {
  OR: [{ verificationStatus: null }, { verificationStatus: "APPROVED" as const }],
} satisfies Prisma.AttendanceRecordWhereInput;
