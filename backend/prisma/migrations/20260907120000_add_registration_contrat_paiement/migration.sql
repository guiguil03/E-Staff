-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "contractSentAt" TIMESTAMP(3),
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3);
