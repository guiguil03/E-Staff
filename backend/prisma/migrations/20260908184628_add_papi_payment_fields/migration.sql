-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "papiNotificationToken" TEXT,
ADD COLUMN     "papiReference" TEXT,
ADD COLUMN     "paymentAmount" INTEGER,
ADD COLUMN     "paymentMethod" TEXT;
