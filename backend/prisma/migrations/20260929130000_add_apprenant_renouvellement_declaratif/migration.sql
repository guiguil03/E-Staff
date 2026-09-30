-- AlterTable
ALTER TABLE "Apprenant" ADD COLUMN     "renewalPaymentReceiptKey" TEXT,
ADD COLUMN     "renewalPaymentReference" TEXT,
ADD COLUMN     "renewalRequestedAt" TIMESTAMP(3);
