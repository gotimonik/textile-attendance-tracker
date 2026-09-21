-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

